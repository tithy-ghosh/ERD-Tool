// Checks that a user query is a single, read-only SELECT-like statement.
//
// This is the FIRST line of defence. The real safety net is the
// BEGIN READ ONLY transaction in explainRunner.ts, so even if this check
// misses something, Postgres itself refuses to write.

export const MAX_SQL_CHARS = 5000;

export type SafetyResult =
  | { ok: true; sql: string }
  | { ok: false; error: string };

const ALLOWED_FIRST_WORDS = new Set(["select", "with", "values"]);

// Words that never belong in a read-only query (checked outside strings,
// comments and quoted names).
const BLOCKED_WORDS = new Set([
  "insert",
  "update", // also blocks SELECT ... FOR UPDATE (it takes row locks)
  "delete",
  "drop",
  "alter",
  "create",
  "truncate",
  "grant",
  "revoke",
  "copy",
  "call",
  "do",
  "vacuum",
  "reindex",
  "cluster",
  "refresh",
  "merge",
  "lock",
  "listen",
  "notify",
  "begin",
  "commit",
  "rollback",
  "savepoint",
  "into", // SELECT ... INTO creates a table
  // Functions that can change settings, burn time or reach the server
  "set_config",
  "pg_sleep",
  "pg_terminate_backend",
  "pg_cancel_backend",
  "pg_reload_conf",
  "pg_read_file",
  "pg_read_binary_file",
  "pg_ls_dir",
  "lo_import",
  "lo_export",
  "dblink",
  "dblink_exec",
]);

function fail(error: string): SafetyResult {
  return { ok: false, error };
}

// Replaces comments, string literals, quoted names and $$ blocks with spaces.
// The result has the SAME length as the input, so positions still match.
// Returns null when a quote or comment is never closed.
function maskSql(sql: string): string | null {
  const out: string[] = [];
  const n = sql.length;
  let i = 0;

  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];

    // -- line comment
    if (c === "-" && next === "-") {
      let j = i;
      while (j < n && sql[j] !== "\n") j++;
      out.push(" ".repeat(j - i));
      i = j;
      continue;
    }

    // /* block comment */ (Postgres allows nesting)
    if (c === "/" && next === "*") {
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (sql[j] === "/" && sql[j + 1] === "*") {
          depth++;
          j += 2;
        } else if (sql[j] === "*" && sql[j + 1] === "/") {
          depth--;
          j += 2;
        } else {
          j++;
        }
      }
      if (depth > 0) return null;
      out.push(" ".repeat(j - i));
      i = j;
      continue;
    }

    // 'string'  (E'...' strings also allow backslash escapes)
    if (c === "'") {
      const prev = sql[i - 1];
      const before = i >= 2 ? sql[i - 2] : "";
      const isEscapeString =
        (prev === "E" || prev === "e") && !/[A-Za-z0-9_$]/.test(before);
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (isEscapeString && sql[j] === "\\") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2; // '' is an escaped quote
            continue;
          }
          closed = true;
          j++;
          break;
        }
        j++;
      }
      if (!closed) return null;
      out.push(" ".repeat(j - i));
      i = j;
      continue;
    }

    // "quoted name"
    if (c === '"') {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') {
            j += 2;
            continue;
          }
          closed = true;
          j++;
          break;
        }
        j++;
      }
      if (!closed) return null;
      out.push(" ".repeat(j - i));
      i = j;
      continue;
    }

    // $tag$ ... $tag$  (dollar quoting)
    if (c === "$" && !/[A-Za-z0-9_$]/.test(sql[i - 1] ?? "")) {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 80));
      if (m) {
        const tag = m[0];
        const end = sql.indexOf(tag, i + tag.length);
        if (end === -1) return null;
        const stop = end + tag.length;
        out.push(" ".repeat(stop - i));
        i = stop;
        continue;
      }
    }

    out.push(c);
    i++;
  }

  return out.join("");
}

export function checkSql(raw: string): SafetyResult {
  if (raw.includes("\0")) return fail("The query contains invalid characters");

  const trimmed = raw.trim();
  if (!trimmed) return fail("Write a query first");
  if (trimmed.length > MAX_SQL_CHARS) {
    return fail(`The query is too long (max ${MAX_SQL_CHARS} characters)`);
  }

  const masked = maskSql(trimmed);
  if (masked === null) {
    return fail("The query has a quote or comment that is never closed");
  }

  // Remove trailing spaces and semicolons (and trailing comments, which are
  // already blanked in the masked text).
  let end = masked.length;
  while (end > 0 && /[\s;]/.test(masked[end - 1])) end--;
  const body = masked.slice(0, end);

  if (!body.trim()) return fail("Write a query first");
  if (body.includes(";")) return fail("Only one statement is allowed");

  const words = body.toLowerCase().match(/[a-z_][a-z0-9_$]*/g) ?? [];
  const first = words[0];

  if (first === "explain") {
    return fail("Do not write EXPLAIN. The tool adds it for you");
  }
  if (!first || !ALLOWED_FIRST_WORDS.has(first)) {
    return fail("Only SELECT, WITH or VALUES queries are allowed");
  }

  for (const word of words) {
    if (BLOCKED_WORDS.has(word)) {
      return fail(
        `The word "${word}" is not allowed. This tool only runs read-only queries`
      );
    }
  }

  return { ok: true, sql: trimmed.slice(0, end) };
}
