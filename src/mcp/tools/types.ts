export interface ToolContext {
  projectRoot: string;
}

export interface McpTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments. */
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  run(args: Record<string, unknown>, ctx: ToolContext): Promise<string>;
}

export function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
