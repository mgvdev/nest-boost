import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../../install/config";

export type Dialect = "postgres" | "mysql" | "sqlite" | "mongodb";

export interface Connection {
  url: string;
  dialect: Dialect;
}

export type ConnectionResult = { ok: true; connection: Connection } | { ok: false; error: string };

/**
 * Resolve the database connection for the schema/query tools. Order:
 * 1. `nest-boost.json` `database.url`
 * 2. `DATABASE_URL` in the environment
 * 3. `DATABASE_URL` in a project `.env` file
 */
export function resolveConnection(projectRoot: string): ConnectionResult {
  const config = loadConfig(projectRoot);
  const url =
    config?.database?.url ||
    process.env.DATABASE_URL ||
    readDotEnv(projectRoot).DATABASE_URL;

  if (!url) {
    return {
      ok: false,
      error:
        "No database connection found. Set `database.url` in nest-boost.json, or a DATABASE_URL " +
        "environment variable / .env entry, then retry.",
    };
  }

  const dialect = dialectOf(url);
  if (!dialect) {
    return {
      ok: false,
      error: `Unsupported database URL scheme in "${redact(url)}". Supported: postgres, mysql/mariadb, sqlite, mongodb.`,
    };
  }

  return { ok: true, connection: { url, dialect } };
}

export function dialectOf(url: string): Dialect | null {
  const scheme = url.slice(0, url.indexOf(":")).toLowerCase();
  if (scheme === "postgres" || scheme === "postgresql") return "postgres";
  if (scheme === "mysql" || scheme === "mariadb") return "mysql";
  if (scheme === "mongodb" || scheme === "mongodb+srv") return "mongodb";
  if (scheme === "sqlite" || scheme === "file") return "sqlite";
  // Bare paths to a sqlite file.
  if (/\.(sqlite3?|db)$/i.test(url)) return "sqlite";
  return null;
}

/** Strip the `sqlite:`/`file:` prefix to a filesystem path. */
export function sqlitePath(url: string): string {
  return url.replace(/^(sqlite|file):(\/\/)?/i, "");
}

/** Hide credentials in a URL for safe error messages. */
export function redact(url: string): string {
  return url.replace(/\/\/[^@/]+@/, "//***@");
}

function readDotEnv(projectRoot: string): Record<string, string> {
  const path = join(projectRoot, ".env");
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}
