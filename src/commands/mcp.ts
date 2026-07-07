import "reflect-metadata";
import { startStdioServer } from "../mcp/server";

export async function runMcp(_args: string[]): Promise<void> {
  // The MCP server runs from the host project's working directory; that is the
  // NestJS app we introspect. stdout is reserved for the MCP protocol, so all
  // diagnostics must go to stderr.
  await startStdioServer({ projectRoot: process.cwd() });
}
