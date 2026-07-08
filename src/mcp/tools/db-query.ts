import { resolveConnection } from "../db/connection";
import { runMongo, runSql } from "../db";
import { ensureReadOnly, ROW_CAP } from "../db/readonly";
import { json, type McpTool } from "./types";

export const dbQueryTool: McpTool = {
  name: "db_query",
  description:
    `Run a READ-ONLY query against the project's database and return rows (capped at ${ROW_CAP}). ` +
    "For SQL databases pass `sql` (must be a single SELECT/WITH/SHOW/EXPLAIN/PRAGMA — writes are " +
    "rejected and it runs in a read-only transaction). For MongoDB pass `collection` and an " +
    "optional `filter` object. Connection is resolved from nest-boost.json `database.url`, " +
    "DATABASE_URL, or .env.",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string", description: "Read-only SQL statement (SQL databases)." },
      collection: { type: "string", description: "Collection to query (MongoDB)." },
      filter: { type: "object", description: "MongoDB find filter (default: {})." },
      limit: { type: "number", description: `Max rows (MongoDB; capped at ${ROW_CAP}).` },
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const resolved = resolveConnection(ctx.projectRoot);
    if (!resolved.ok) return json({ error: resolved.error });
    const conn = resolved.connection;

    try {
      if (conn.dialect === "mongodb") {
        const collection = typeof args.collection === "string" ? args.collection : undefined;
        if (!collection) return json({ error: "MongoDB queries require a `collection`." });
        const filter = (args.filter && typeof args.filter === "object" ? args.filter : {}) as Record<string, unknown>;
        const limit = typeof args.limit === "number" ? args.limit : ROW_CAP;
        return json({ dialect: conn.dialect, ...(await runMongo(conn, collection, filter, limit)) });
      }

      const sql = typeof args.sql === "string" ? args.sql : undefined;
      if (!sql) return json({ error: "SQL databases require a `sql` statement." });
      const guard = ensureReadOnly(sql);
      if (!guard.ok) return json({ error: guard.error });

      return json({ dialect: conn.dialect, ...(await runSql(conn, guard.sql)) });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
};
