import { sqlitePath } from "./connection";
import { ROW_CAP } from "./readonly";
import type { QueryResult, SchemaResult, TableSchema } from "./index";

interface SqliteHandle {
  all(sql: string): Record<string, unknown>[];
  close(): void;
}

/**
 * Open a read-only SQLite connection with whatever driver is available, in
 * order: Bun's built-in `bun:sqlite` (tests / Bun runtime), `better-sqlite3`
 * (recommended on Node), then Node 22+'s built-in `node:sqlite`.
 */
async function openSqlite(path: string, readonly: boolean): Promise<SqliteHandle> {
  if (typeof Bun !== "undefined") {
    const { Database } = await import("bun:sqlite");
    const db = new Database(path, { readonly });
    return { all: (sql) => db.query(sql).all() as Record<string, unknown>[], close: () => db.close() };
  }

  try {
    const mod: any = await import("better-sqlite3" as string);
    const Database = mod.default ?? mod;
    const db = new Database(path, { readonly });
    return { all: (sql) => db.prepare(sql).all(), close: () => db.close() };
  } catch {
    // fall through to node:sqlite
  }

  const mod: any = await import("node:sqlite");
  const db = new mod.DatabaseSync(path, { readOnly: readonly });
  return { all: (sql) => db.prepare(sql).all(), close: () => db.close() };
}

/** Only allow simple identifiers where parameters can't be bound (PRAGMA). */
function safeIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid table name: ${name}`);
  return name;
}

export async function schema(url: string, table?: string): Promise<SchemaResult> {
  const db = await openSqlite(sqlitePath(url), true);
  try {
    const names: string[] = table
      ? [table]
      : (db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name") as {
          name: string;
        }[]).map((r) => r.name);

    const tables: TableSchema[] = names.map((name) => {
      const cols = db.all(`PRAGMA table_info(${safeIdent(name)})`) as {
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

export async function query(url: string, sql: string): Promise<QueryResult> {
  const db = await openSqlite(sqlitePath(url), true); // driver-level read-only
  try {
    const rows = db.all(sql);
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
