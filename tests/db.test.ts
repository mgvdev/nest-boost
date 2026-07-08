import { Database } from "bun:sqlite";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dialectOf, resolveConnection, sqlitePath } from "../src/mcp/db/connection";
import { ensureReadOnly } from "../src/mcp/db/readonly";
import { dbQueryTool } from "../src/mcp/tools/db-query";
import { dbSchemaTool } from "../src/mcp/tools/db-schema";

let dir: string;
let ctx: { projectRoot: string };

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "nest-boost-db-"));
  const dbPath = join(dir, "test.db");
  const db = new Database(dbPath);
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL, name TEXT)");
  db.run("INSERT INTO users (email, name) VALUES ('ada@x.io', 'Ada'), ('alan@x.io', 'Alan')");
  db.close();

  writeFileSync(
    join(dir, "nest-boost.json"),
    JSON.stringify({ agents: [], database: { url: `sqlite:${dbPath}` } }),
  );
  ctx = { projectRoot: dir };
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("connection resolver", () => {
  test("maps URL schemes to dialects", () => {
    expect(dialectOf("postgres://u@h/db")).toBe("postgres");
    expect(dialectOf("postgresql://u@h/db")).toBe("postgres");
    expect(dialectOf("mysql://u@h/db")).toBe("mysql");
    expect(dialectOf("mariadb://u@h/db")).toBe("mysql");
    expect(dialectOf("mongodb+srv://h/db")).toBe("mongodb");
    expect(dialectOf("sqlite:./dev.db")).toBe("sqlite");
    expect(dialectOf("./data/app.sqlite")).toBe("sqlite");
    expect(dialectOf("redis://h")).toBeNull();
  });

  test("strips the sqlite scheme to a path", () => {
    expect(sqlitePath("sqlite:/tmp/a.db")).toBe("/tmp/a.db");
    expect(sqlitePath("file:///tmp/a.db")).toBe("/tmp/a.db");
  });

  test("resolves the connection from nest-boost.json", () => {
    const res = resolveConnection(dir);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.connection.dialect).toBe("sqlite");
  });

  test("errors clearly when no URL is configured", () => {
    const empty = mkdtempSync(join(tmpdir(), "nest-boost-nodb-"));
    try {
      const prev = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      const res = resolveConnection(empty);
      expect(res.ok).toBe(false);
      if (prev) process.env.DATABASE_URL = prev;
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe("read-only guard", () => {
  test("allows read statements", () => {
    expect(ensureReadOnly("SELECT * FROM users").ok).toBe(true);
    expect(ensureReadOnly("  with x as (select 1) select * from x ").ok).toBe(true);
    expect(ensureReadOnly("PRAGMA table_info(users)").ok).toBe(true);
  });

  test("rejects writes and stacked statements", () => {
    expect(ensureReadOnly("DELETE FROM users").ok).toBe(false);
    expect(ensureReadOnly("UPDATE users SET name='x'").ok).toBe(false);
    expect(ensureReadOnly("DROP TABLE users").ok).toBe(false);
    expect(ensureReadOnly("SELECT 1; DROP TABLE users").ok).toBe(false);
    expect(ensureReadOnly("with t as (select 1) insert into users values (1)").ok).toBe(false);
  });
});

describe("db_schema tool (sqlite)", () => {
  test("reads tables and columns", async () => {
    const res = JSON.parse(await dbSchemaTool.run({}, ctx));
    expect(res.dialect).toBe("sqlite");
    const users = res.tables.find((t: any) => t.name === "users");
    expect(users).toBeDefined();
    const cols = Object.fromEntries(users.columns.map((c: any) => [c.name, c]));
    expect(cols.id.key).toBe("PK");
    expect(cols.email.nullable).toBe(false);
    expect(cols.name.nullable).toBe(true);
  });

  test("can focus on one table", async () => {
    const res = JSON.parse(await dbSchemaTool.run({ table: "users" }, ctx));
    expect(res.tables).toHaveLength(1);
    expect(res.tables[0].name).toBe("users");
  });
});

describe("db_query tool (sqlite)", () => {
  test("runs a read-only SELECT and returns rows", async () => {
    const res = JSON.parse(await dbQueryTool.run({ sql: "SELECT id, email FROM users ORDER BY id" }, ctx));
    expect(res.dialect).toBe("sqlite");
    expect(res.rowCount).toBe(2);
    expect(res.columns).toEqual(["id", "email"]);
    expect(res.rows[0].email).toBe("ada@x.io");
    expect(res.truncated).toBe(false);
  });

  test("rejects a write statement without touching the DB", async () => {
    const res = JSON.parse(await dbQueryTool.run({ sql: "DELETE FROM users" }, ctx));
    expect(res.error).toContain("read-only");
    // confirm nothing was deleted
    const check = JSON.parse(await dbQueryTool.run({ sql: "SELECT count(*) AS n FROM users" }, ctx));
    expect(check.rows[0].n).toBe(2);
  });

  test("requires sql for a SQL database", async () => {
    const res = JSON.parse(await dbQueryTool.run({}, ctx));
    expect(res.error).toContain("sql");
  });
});
