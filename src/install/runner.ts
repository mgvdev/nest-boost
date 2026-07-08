/**
 * The launcher written into agents' MCP config to start `nest-boost mcp`.
 *
 * nest-boost requires Bun at runtime (the MCP server imports your app's
 * TypeScript modules and boots Nest), so the bin carries a `#!/usr/bin/env bun`
 * shebang. The launcher below only resolves/fetches the package — both `npx`
 * and `bunx` honor that shebang — so we default to `npx` for the widest
 * compatibility, with `bunx` available via an explicit choice.
 */
export type Runner = "bunx" | "npx";

export interface McpEntry {
  command: string;
  args: string[];
}

/** Pick the launcher: an explicit choice, else `npx` (the default). */
export function resolveRunner(preferred?: string): Runner {
  if (preferred === "bunx" || preferred === "npx") return preferred;
  return "npx";
}

/** Build the MCP server entry for a runner. `npx` gets `-y` to avoid an install prompt. */
export function mcpServerEntry(runner: Runner): McpEntry {
  return runner === "npx"
    ? { command: "npx", args: ["-y", "nest-boost", "mcp"] }
    : { command: "bunx", args: ["nest-boost", "mcp"] };
}

/** The launch command as a single string, e.g. for CLI-based registration hints. */
export function mcpCommandString(runner: Runner): string {
  const entry = mcpServerEntry(runner);
  return [entry.command, ...entry.args].join(" ");
}
