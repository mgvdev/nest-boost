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
  return mergeMcpServer(projectRoot, target.file, MCP_SERVER_KEY, entry);
}

/**
 * Merge a single named server into an MCP config file. Used for nest-boost's own
 * server and for MCP servers exposed by third-party packages.
 */
export function mergeMcpServer(
  projectRoot: string,
  file: string,
  key: string,
  entry: McpEntry,
): string {
  const path = join(projectRoot, file);
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
  config.mcpServers[key] = { command: entry.command, args: [...entry.args] };

  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  return file;
}
