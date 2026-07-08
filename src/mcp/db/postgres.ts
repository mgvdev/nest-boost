import { DriverMissingError, type ColumnInfo, type QueryResult, type SchemaResult, type TableSchema } from "./index";
import { ROW_CAP } from "./readonly";

async function loadDriver(): Promise<any> {
  const spec = "pg"; // indirection: optional peer, resolved from the host project at runtime
  try {
    return await import(spec);
  } catch {
    throw new DriverMissingError("pg");
  }
}

async function withClient<T>(url: string, fn: (client: any) => Promise<T>): Promise<T> {
  const pg = await loadDriver();
  const Client = pg.default?.Client ?? pg.Client;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function schema(url: string, table?: string): Promise<SchemaResult> {
  return withClient(url, async (client) => {
    const params: unknown[] = [];
    let where = "c.table_schema NOT IN ('pg_catalog','information_schema')";
    if (table) {
      params.push(table);
      where += ` AND c.table_name = $${params.length}`;
    }

    const { rows } = await client.query(
      `SELECT c.table_name, c.column_name, c.data_type, c.is_nullable,
              (pk.column_name IS NOT NULL) AS is_pk
       FROM information_schema.columns c
       LEFT JOIN (
         SELECT kcu.table_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY'
       ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
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
        key: r.is_pk ? "PK" : undefined,
      };
      t.columns.push(col);
    }

    return { dialect: "postgres", tables: [...byTable.values()] };
  });
}

export function query(url: string, sql: string): Promise<QueryResult> {
  return withClient(url, async (client) => {
    await client.query("BEGIN TRANSACTION READ ONLY");
    try {
      const bounded = boundSelect(sql);
      const res = await client.query(bounded);
      const rows = res.rows ?? [];
      const truncated = rows.length > ROW_CAP;
      return {
        columns: (res.fields ?? []).map((f: any) => f.name),
        rows: truncated ? rows.slice(0, ROW_CAP) : rows,
        rowCount: Math.min(rows.length, ROW_CAP),
        truncated,
      };
    } finally {
      await client.query("ROLLBACK");
    }
  });
}

/** Bound row-producing queries at the DB so we never pull a whole table. */
function boundSelect(sql: string): string {
  const leader = sql.match(/^[a-z]+/i)?.[0].toLowerCase();
  if (leader === "select" || leader === "with") {
    return `SELECT * FROM (${sql}) AS _nest_boost_sub LIMIT ${ROW_CAP + 1}`;
  }
  return sql;
}
