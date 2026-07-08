import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { appInfoTool } from "./tools/app-info";
import { dbQueryTool } from "./tools/db-query";
import { dbSchemaTool } from "./tools/db-schema";
import { evaluateTool } from "./tools/evaluate";
import { graphTool } from "./tools/graph";
import { nestCliTool } from "./tools/nest-cli";
import { routesTool } from "./tools/routes";
import type { McpTool, ToolContext } from "./tools/types";

export const TOOLS: McpTool[] = [
  appInfoTool,
  routesTool,
  graphTool,
  nestCliTool,
  dbSchemaTool,
  dbQueryTool,
  evaluateTool,
];

export function createServer(ctx: ToolContext): Server {
  const server = new Server(
    { name: "nest-boost", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }
    try {
      const text = await tool.run(request.params.arguments ?? {}, ctx);
      return { content: [{ type: "text", text }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Tool error: ${message}` }], isError: true };
    }
  });

  return server;
}

export async function startStdioServer(ctx: ToolContext): Promise<void> {
  const server = createServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
