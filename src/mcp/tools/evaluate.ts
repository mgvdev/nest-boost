import { loadConfig } from "../../install/config";
import { bootContext } from "../evaluate/boot-full";
import { runEvaluate } from "../evaluate/run";
import { json, type McpTool } from "./types";

export const evaluateTool: McpTool = {
  name: "evaluate",
  description:
    "Execute a TypeScript/JavaScript snippet inside the fully-booted application (REPL / " +
    "Tinker-style) and return the serialized result. `get(Token)` / `$(Token)` resolve a " +
    "provider, and every provider/controller class is available by name — e.g. " +
    "`await $(UsersService).findAll()`. Supports await. WARNING: this boots the app for real " +
    "(lifecycle hooks + live DB/network connections) and runs ARBITRARY code with no read-only " +
    "guard — it can mutate data. Disabled unless explicitly enabled in nest-boost.json.",
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
    const config = loadConfig(ctx.projectRoot);
    if (!config?.evaluate?.enabled) {
      return json({
        error:
          "The `evaluate` tool is disabled. It boots your app for real and runs arbitrary code. " +
          'Enable it by setting `"evaluate": { "enabled": true }` in nest-boost.json, or reinstall with `--enable-evaluate`.',
      });
    }

    const code = typeof args.code === "string" ? args.code : "";
    if (!code.trim()) return json({ error: "`code` is required." });

    const project = typeof args.project === "string" ? args.project : undefined;
    const boot = await bootContext(ctx.projectRoot, project);
    if (!boot.ok) return json({ error: boot.error });

    const timeoutMs = typeof args.timeoutMs === "number" ? args.timeoutMs : 5000;
    try {
      const { result, globals } = await runEvaluate(boot.app, boot.modules, code, timeoutMs);
      return json({ project: boot.project, result, availableProviders: globals.length });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
};
