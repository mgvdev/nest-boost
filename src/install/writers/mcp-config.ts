import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { MCP_SERVER_KEY, type McpConfigTarget } from "../agents/agent";
import type { McpEntry } from "../runner";

/**
 * Non-destructively merge the nest-boost MCP server entry into an agent's JSON
 * config file (`mcpServers.nest-boost`). Existing servers and unrelated keys are
 * preserved. Idempotent: re-running overwrites only our own entry.
 */
export function writeMcpConfig(
  projectRoot: string,
  target: McpConfigTarget,
  entry: McpEntry,
): string {
  const path = join(projectRoot, target.file);
  mkdirSync(dirname(path), { recursive: true });

  let config: Record<string, any> = {};
  if (existsSync(path)) {
    try {
      config = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      config = {};
    }
  }

  config.mcpServers ??= {};
  config.mcpServers[MCP_SERVER_KEY] = { command: entry.command, args: [...entry.args] };

  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  return target.file;
}
