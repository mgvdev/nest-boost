import { DriverMissingError, type ColumnInfo, type QueryResult, type SchemaResult, type TableSchema } from "./index";
import { ROW_CAP } from "./readonly";

async function loadDriver(): Promise<any> {
  const spec = "mysql2/promise"; // indirection: optional peer, resolved from the host project
  try {
    return await import(spec);
  } catch {
    throw new DriverMissingError("mysql2");
  }
}

async function withConn<T>(url: string, fn: (conn: any) => Promise<T>): Promise<T> {
  const mysql = await loadDriver();
  const createConnection = mysql.createConnection ?? mysql.default?.createConnection;
  const conn = await createConnection(url);
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

export function schema(url: string, table?: string): Promise<SchemaResult> {
  return withConn(url, async (conn) => {
    const params: unknown[] = [];
    let where = "c.table_schema = DATABASE()";
    if (table) {
      params.push(table);
      where += " AND c.table_name = ?";
    }

    const [rows] = await conn.query(
      `SELECT c.table_name AS table_name, c.column_name AS column_name,
              c.data_type AS data_type, c.is_nullable AS is_nullable, c.column_key AS column_key
       FROM information_schema.columns c
       WHERE ${where}
       ORDER BY c.table_name, c.ordinal_position`,
      params,
    );

    const byTable = new Map<string, TableSchema>();
    for (const r of rows as any[]) {
      let t = byTable.get(r.table_name);
      if (!t) {
        t = { name: r.table_name, columns: [] };
        byTable.set(r.table_name, t);
      }
      const col: ColumnInfo = {
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === "YES",
        key: r.column_key === "PRI" ? "PK" : r.column_key === "MUL" ? "FK" : undefined,
      };
      t.columns.push(col);
    }

    return { dialect: "mysql", tables: [...byTable.values()] };
  });
}

export function query(url: string, sql: string): Promise<QueryResult> {
  return withConn(url, async (conn) => {
    await conn.query("START TRANSACTION READ ONLY");
    try {
      const leader = sql.match(/^[a-z]+/i)?.[0].toLowerCase();
      const bounded =
        leader === "select" || leader === "with"
          ? `SELECT * FROM (${sql}) AS _nest_boost_sub LIMIT ${ROW_CAP + 1}`
          : sql;
      const [rows, fields] = await conn.query(bounded);
      const list = Array.isArray(rows) ? rows : [];
      const truncated = list.length > ROW_CAP;
      return {
        columns: Array.isArray(fields) ? fields.map((f: any) => f.name) : undefined,
        rows: truncated ? list.slice(0, ROW_CAP) : list,
        rowCount: Math.min(list.length, ROW_CAP),
        truncated,
      };
    } finally {
      await conn.query("ROLLBACK");
    }
  });
}
