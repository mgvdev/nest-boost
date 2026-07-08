const MAX_DEPTH = 6;
const MAX_ARRAY = 100;
const MAX_KEYS = 100;

/**
 * Convert an arbitrary evaluation result into a JSON-friendly structure:
 * depth-limited, circular-safe, and lossy for functions/buffers/class instances
 * (kept readable rather than exhaustive).
 */
export function safeSerialize(value: unknown): unknown {
  return walk(value, 0, new WeakSet());
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === "undefined") return "[undefined]";
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (t === "bigint") return `${(value as bigint).toString()}n`;
  if (t === "symbol") return (value as symbol).toString();
  if (t === "function") return `[Function ${(value as Function).name || "anonymous"}]`;

  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return value.toString();
  if (value instanceof Error) {
    return { __type: value.name, message: value.message };
  }
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return `[Binary ${(value as any).byteLength ?? ""} bytes]`;
  }

  if (typeof value === "object" && seen.has(value as object)) return "[Circular]";
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? "[Array]" : "[Object]";

  if (Array.isArray(value)) {
    seen.add(value);
    const out = value.slice(0, MAX_ARRAY).map((v) => walk(v, depth + 1, seen));
    if (value.length > MAX_ARRAY) out.push(`… ${value.length - MAX_ARRAY} more`);
    return out;
  }

  if (value instanceof Map) {
    return { __type: "Map", entries: walk([...value.entries()], depth + 1, seen) };
  }
  if (value instanceof Set) {
    return { __type: "Set", values: walk([...value.values()], depth + 1, seen) };
  }

  const obj = value as Record<string, unknown>;
  seen.add(obj);
  const out: Record<string, unknown> = {};
  const ctor = obj.constructor?.name;
  if (ctor && ctor !== "Object") out.__type = ctor;

  let count = 0;
  for (const key of Object.keys(obj)) {
    if (count++ >= MAX_KEYS) {
      out["…"] = "more keys omitted";
      break;
    }
    try {
      out[key] = walk(obj[key], depth + 1, seen);
    } catch {
      out[key] = "[unreadable]";
    }
  }
  return out;
}
