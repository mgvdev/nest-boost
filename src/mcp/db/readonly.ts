/** Max rows any query tool returns; results beyond this are truncated with a flag. */
export const ROW_CAP = 200;

const READ_LEADERS = ["select", "with", "show", "explain", "pragma", "table", "describe", "desc"];

const WRITE_KEYWORDS =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|replace|merge|call|attach|vacuum|reindex|commit|rollback|begin|set)\b/i;

export type GuardResult = { ok: true; sql: string } | { ok: false; error: string };

/**
 * Enforce a single, read-only SQL statement. This is the primary safety gate for
 * agent-issued SQL — combined with a read-only transaction / connection at the
 * driver layer. Rejects DML/DDL and multi-statement input.
 */
export function ensureReadOnly(raw: string): GuardResult {
  const sql = raw.trim().replace(/;\s*$/, "");
  if (!sql) return { ok: false, error: "Empty SQL statement." };

  // No stacked statements (a lone trailing ; was already stripped).
  if (sql.includes(";")) {
    return { ok: false, error: "Only a single statement is allowed (no `;` separators)." };
  }

  const leader = sql.match(/^[a-z]+/i)?.[0].toLowerCase() ?? "";
  if (!READ_LEADERS.includes(leader)) {
    return {
      ok: false,
      error: `Only read-only queries are allowed (must start with: ${READ_LEADERS.join(", ")}). Got "${leader || "?"}".`,
    };
  }

  // Belt-and-suspenders: reject write keywords even after a read leader
  // (e.g. a CTE hiding an INSERT). CTEs that only read still pass.
  if (leader === "with" && WRITE_KEYWORDS.test(sql)) {
    return { ok: false, error: "The query contains a write keyword and was rejected." };
  }

  return { ok: true, sql };
}
