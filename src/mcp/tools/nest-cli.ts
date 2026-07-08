import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { json, type McpTool } from "./types";

const run = promisify(execFile);

/** Subcommands the agent is allowed to run. Read-safe + scaffolding only; never arbitrary shell. */
const ALLOWED = new Set(["generate", "g", "build", "info"]);

function resolveNestBin(projectRoot: string): { cmd: string; prefix: string[] } {
  const local = join(projectRoot, "node_modules", ".bin", "nest");
  if (existsSync(local)) return { cmd: local, prefix: [] };
  // Fall back to running the CLI via npx without a local install.
  return { cmd: "npx", prefix: ["-y", "@nestjs/cli"] };
}

async function nest(projectRoot: string, args: string[]): Promise<string> {
  const { cmd, prefix } = resolveNestBin(projectRoot);
  try {
    const { stdout, stderr } = await run(cmd, [...prefix, ...args], {
      cwd: projectRoot,
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return [stdout, stderr].filter(Boolean).join("\n").trim();
  } catch (err: any) {
    const out = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
    return out || `nest command failed: ${err.message}`;
  }
}

export const nestCliTool: McpTool = {
  name: "nest_cli",
  description:
    "List or run the Nest CLI. action=\"list\" shows the available `nest` commands. " +
    "action=\"run\" executes a whitelisted subcommand (generate, build, info) in the project — " +
    "e.g. command=\"generate\" args=[\"service\", \"cats\"]. Arbitrary shell is not permitted.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "run"], description: "\"list\" or \"run\"." },
      command: {
        type: "string",
        description: "For action=run: the subcommand (generate|g|build|info).",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "For action=run: additional arguments passed to the subcommand.",
      },
    },
    required: ["action"],
    additionalProperties: false,
  },

  async run(args, ctx) {
    const action = args.action;
    if (action === "list") {
      return json({ help: await nest(ctx.projectRoot, ["--help"]) });
    }
    if (action === "run") {
      const command = typeof args.command === "string" ? args.command : "";
      if (!ALLOWED.has(command)) {
        return json({
          error: `Subcommand "${command}" is not allowed. Permitted: ${[...ALLOWED].join(", ")}.`,
        });
      }
      const extra = Array.isArray(args.args) ? args.args.map(String) : [];
      const output = await nest(ctx.projectRoot, [command, ...extra]);
      return json({ command: [command, ...extra].join(" "), output });
    }
    return json({ error: `Unknown action "${String(action)}". Use "list" or "run".` });
  },
};
