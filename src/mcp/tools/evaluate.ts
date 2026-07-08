import { loadConfig } from "../../install/config";
import { bootContext } from "../evaluate/boot-full";
import { listProviders, runEvaluate } from "../evaluate/run";
import { json, type McpTool } from "./types";

export const evaluateTool: McpTool = {
  name: "evaluate",
  description:
    "Execute a TypeScript/JavaScript snippet inside the fully-booted application (REPL / " +
    "Tinker-style) and return the serialized result. `get(Token)` / `$(Token)` resolve a " +
    "provider, and every provider/controller class is available by name — e.g. " +
    "`await $(UsersService).findAll()`. Supports await. DEVELOPMENT-ONLY: this boots the app for " +
    "real (lifecycle hooks + live DB/network connections) and runs ARBITRARY code with no " +
    "read-only guard — it can mutate data. Enabled by default; blocked when NODE_ENV=production.",
  inputSchema: {
    type: "object",
    properties: {
      code: { type: "string", description: "Code to evaluate. A single expression, or statements ending in `return`." },
      project: { type: "string", description: "Monorepo application to boot (defaults to the workspace default project)." },
      timeoutMs: { type: "number", description: "Max execution time in ms (default 5000)." },
    },
    required: ["code"],
    additionalProperties: false,
  },

  async run(args, ctx) {
    // Development-only: never run against a production environment.
    if (process.env.NODE_ENV === "production") {
      return json({
        error:
          "The `evaluate` tool is development-only and is blocked because NODE_ENV=production. " +
          "It boots the app for real and runs arbitrary code.",
      });
    }

    // Enabled by default; only an explicit `false` disables it.
    const config = loadConfig(ctx.projectRoot);
    if (config?.evaluate?.enabled === false) {
      return json({
        error:
          'The `evaluate` tool is disabled in nest-boost.json (`"evaluate": { "enabled": false }`). ' +
          "Set it to true (or remove it) to use it. It boots your app for real and runs arbitrary code.",
      });
    }

    const code = typeof args.code === "string" ? args.code : "";
    if (!code.trim()) return json({ error: "`code` is required." });

    const project = typeof args.project === "string" ? args.project : undefined;
    const boot = await bootContext(ctx.projectRoot, project);
    if (!boot.ok) return json({ error: boot.error });

    const timeoutMs = typeof args.timeoutMs === "number" ? args.timeoutMs : 5000;
    try {
      const { result, providers } = await runEvaluate(boot.app, boot.modules, code, timeoutMs);
      return json({ project: boot.project, result, providers });
    } catch (err) {
      // Surface the resolvable providers so a failed lookup is easy to correct.
      return json({
        error: err instanceof Error ? err.message : String(err),
        availableProviders: listProviders(boot.modules),
      });
    }
  },
};
