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

/**
 * Serialize a tool result compactly (no indentation) to save tokens. Still valid
 * JSON the agent can parse. Undefined-valued keys are dropped by JSON.stringify;
 * tools should also omit empty arrays/false flags before calling this.
 */
export function json(value: unknown): string {
  return JSON.stringify(value);
}

/** Drop `undefined`, empty arrays, and empty objects so the payload stays lean. */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}
