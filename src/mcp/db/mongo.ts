import { DriverMissingError, type CollectionSchema, type QueryResult, type SchemaResult } from "./index";
import { ROW_CAP } from "./readonly";

async function loadDriver(): Promise<any> {
  const spec = "mongodb"; // indirection: optional peer, resolved from the host project
  try {
    return await import(spec);
  } catch {
    throw new DriverMissingError("mongodb");
  }
}

async function withDb<T>(url: string, fn: (db: any) => Promise<T>): Promise<T> {
  const mongodb = await loadDriver();
  const MongoClient = mongodb.MongoClient ?? mongodb.default?.MongoClient;
  const client = new MongoClient(url);
  await client.connect();
  try {
    return await fn(client.db());
  } finally {
    await client.close();
  }
}

/** Infer a shallow field→type map from a sample document. */
function inferFields(doc: Record<string, unknown> | null): Record<string, string> {
  if (!doc) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(doc)) {
    out[k] = Array.isArray(v) ? "array" : v === null ? "null" : typeof v === "object" ? "object" : typeof v;
  }
  return out;
}

export function schema(url: string, collection?: string): Promise<SchemaResult> {
  return withDb(url, async (db) => {
    const names: string[] = collection
      ? [collection]
      : (await db.listCollections().toArray()).map((c: any) => c.name);

    const collections: CollectionSchema[] = [];
    for (const name of names) {
      const sample = await db.collection(name).findOne({});
      collections.push({ name, fields: inferFields(sample) });
    }
    return { dialect: "mongodb", collections };
  });
}

export function find(
  url: string,
  collection: string,
  filter: Record<string, unknown>,
  limit: number,
): Promise<QueryResult> {
  return withDb(url, async (db) => {
    const cap = Math.min(limit || ROW_CAP, ROW_CAP);
    const docs = await db.collection(collection).find(filter).limit(cap + 1).toArray();
    const truncated = docs.length > cap;
    const rows = truncated ? docs.slice(0, cap) : docs;
    return { rows, rowCount: rows.length, truncated };
  });
}
