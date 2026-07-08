import type { Connection } from "./connection";

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key?: "PK" | "FK";
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
}

export interface CollectionSchema {
  name: string;
  fields: Record<string, string>;
}

export interface SchemaResult {
  dialect: string;
  tables?: TableSchema[];
  collections?: CollectionSchema[];
}

export interface QueryResult {
  columns?: string[];
  rows: unknown[];
  rowCount: number;
  truncated: boolean;
}

/** Thrown when the host project doesn't have the driver a dialect needs. */
export class DriverMissingError extends Error {
  constructor(pkg: string) {
    super(`The "${pkg}" driver is not installed in this project. Add it (\`bun add ${pkg}\`) to use the database tools.`);
    this.name = "DriverMissingError";
  }
}

export async function readSchema(conn: Connection, table?: string): Promise<SchemaResult> {
  switch (conn.dialect) {
    case "postgres":
      return (await import("./postgres")).schema(conn.url, table);
    case "mysql":
      return (await import("./mysql")).schema(conn.url, table);
    case "sqlite":
      return (await import("./sqlite")).schema(conn.url, table);
    case "mongodb":
      return (await import("./mongo")).schema(conn.url, table);
  }
}

export async function runSql(conn: Connection, sql: string): Promise<QueryResult> {
  switch (conn.dialect) {
    case "postgres":
      return (await import("./postgres")).query(conn.url, sql);
    case "mysql":
      return (await import("./mysql")).query(conn.url, sql);
    case "sqlite":
      return (await import("./sqlite")).query(conn.url, sql);
    case "mongodb":
      throw new Error("MongoDB is not a SQL database — use `collection` + `filter` instead of `sql`.");
  }
}

export async function runMongo(
  conn: Connection,
  collection: string,
  filter: Record<string, unknown>,
  limit: number,
): Promise<QueryResult> {
  if (conn.dialect !== "mongodb") {
    throw new Error(`"${conn.dialect}" is a SQL database — use \`sql\` instead of \`collection\`/\`filter\`.`);
  }
  return (await import("./mongo")).find(conn.url, collection, filter, limit);
}
