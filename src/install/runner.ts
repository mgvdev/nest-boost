/**
 * The launcher written into agents' MCP config to start `nest-boost mcp`.
 *
 * nest-boost requires Bun at runtime (the MCP server imports your app's
 * TypeScript modules and boots Nest), so the bin carries a `#!/usr/bin/env bun`
 * shebang. The launcher below only resolves/fetches the package — both `bunx`
 * and `npx` honor that shebang — so we prefer `bunx` and fall back to `npx` for
 * environments where Bun's CLI isn't on PATH.
 */
export type Runner = "bunx" | "npx";

export interface McpEntry {
  command: string;
  args: string[];
}

/** Pick the launcher: an explicit choice, else `bunx` when Bun is present, else `npx`. */
export function resolveRunner(preferred?: string): Runner {
  if (preferred === "bunx" || preferred === "npx") return preferred;
  const hasBun = typeof Bun !== "undefined" && !!Bun.which("bun");
  return hasBun ? "bunx" : "npx";
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
