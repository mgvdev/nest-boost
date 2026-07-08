# Database tools

`db_schema` and `db_query` give the agent grounded knowledge of your **actual** database — the
schema after migrations, and real rows — independent of the ORM you use. They connect directly
with a driver (they do **not** boot your app), keeping them ORM-agnostic.

## Connection

Resolved, in order:

1. `nest-boost.json` → `database.url`
2. `DATABASE_URL` in the environment
3. `DATABASE_URL` in a project `.env`

```json
{ "database": { "url": "postgres://user:pass@localhost:5432/app" } }
```

The dialect is inferred from the URL scheme: `postgres(ql)://`, `mysql://` / `mariadb://`,
`mongodb(+srv)://`, `sqlite:` / `file:` (or a `*.db` / `*.sqlite` path).

## Engines & drivers

| Engine | Driver (resolved from your project, or built-in) |
| --- | --- |
| PostgreSQL | `pg` |
| MySQL / MariaDB | `mysql2` |
| SQLite | `node:sqlite` (Node 22+) or `better-sqlite3` |
| MongoDB | `mongodb` |

The SQL drivers are optional peers loaded from your project's `node_modules` (already there if
your app uses them). If a driver is missing, the tool returns a clear "install X" message.

## `db_schema`

- `table` *(optional)* — restrict to one table (SQL) or collection (MongoDB).

Returns SQL tables with columns (`type`, `nullable`, primary/foreign `key`), or MongoDB
collections with a sampled field→type map.

## `db_query`

**Read-only, enforced.** For SQL databases:

- `sql` — a single read statement. Only `SELECT` / `WITH` / `SHOW` / `EXPLAIN` / `PRAGMA` /
  `DESCRIBE` are allowed; writes and stacked statements are rejected, and the query runs inside
  a read-only transaction. Row-producing queries are capped (200 rows).

For MongoDB:

- `collection` — the collection to query
- `filter` *(optional)* — a `find` filter object (default `{}`)
- `limit` *(optional)* — capped at 200

The agent can inspect data but never mutate it. For read/write access to the running app, use
the [`evaluate`](./evaluate.md) tool instead (opt-in, development-only).
