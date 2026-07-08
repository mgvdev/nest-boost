import { resolveConnection } from "../db/connection";
import { readSchema } from "../db";
import { json, type McpTool } from "./types";

export const dbSchemaTool: McpTool = {
  name: "db_schema",
  description:
    "Read the database schema for the project's configured connection: SQL tables with their " +
    "columns (type, nullable, primary/foreign key), or MongoDB collections with sampled field " +
    "types. Connection is resolved from nest-boost.json `database.url`, DATABASE_URL, or .env. " +
    "Optionally pass a single table/collection name.",
  inputSchema: {
    type: "object",
    properties: {
      table: {
        type: "string",
        description: "Restrict to one table (SQL) or collection (MongoDB).",
      },
    },
    additionalProperties: false,
  },

  async run(args, ctx) {
    const resolved = resolveConnection(ctx.projectRoot);
    if (!resolved.ok) return json({ error: resolved.error });

    const table = typeof args.table === "string" ? args.table : undefined;
    try {
      return json(await readSchema(resolved.connection, table));
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
};
