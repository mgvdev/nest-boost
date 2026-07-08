import { Database } from "bun:sqlite";
import { sqlitePath } from "./connection";
import { ROW_CAP } from "./readonly";
import type { QueryResult, SchemaResult, TableSchema } from "./index";

/** Only allow simple identifiers where parameters can't be bound (PRAGMA). */
function safeIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid table name: ${name}`);
  return name;
}

export function schema(url: string, table?: string): SchemaResult {
  const db = new Database(sqlitePath(url), { readonly: true });
  try {
    const names: string[] = table
      ? [table]
      : (db
          .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all() as { name: string }[]).map((r) => r.name);

    const tables: TableSchema[] = names.map((name) => {
      const cols = db.query(`PRAGMA table_info(${safeIdent(name)})`).all() as {
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }[];
      return {
        name,
        columns: cols.map((c) => ({
          name: c.name,
          type: c.type || "?",
          nullable: c.notnull === 0,
          key: c.pk ? ("PK" as const) : undefined,
        })),
      };
    });

    return { dialect: "sqlite", tables };
  } finally {
    db.close();
  }
}

export function query(url: string, sql: string): QueryResult {
  const db = new Database(sqlitePath(url), { readonly: true }); // driver-level read-only
  try {
    const rows = db.query(sql).all() as Record<string, unknown>[];
    const truncated = rows.length > ROW_CAP;
    const capped = truncated ? rows.slice(0, ROW_CAP) : rows;
    return {
      columns: capped.length ? Object.keys(capped[0]) : [],
      rows: capped,
      rowCount: capped.length,
      truncated,
    };
  } finally {
    db.close();
  }
}
