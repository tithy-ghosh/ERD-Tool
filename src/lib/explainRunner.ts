// Connects to the user's database, runs EXPLAIN inside a READ ONLY
// transaction, and always rolls back and closes the connection.
//
// Two modes:
//   "explain" - plain EXPLAIN. Only plans the query, does NOT run it.
//   "analyze" - EXPLAIN ANALYZE. Really RUNS the query to get true timings.
//               This is why the READ ONLY transaction and the timeout matter.

import net from "node:net";
import { Client } from "pg";
import type { ConnectionTarget } from "./hostGuard";

export type ExplainMode = "explain" | "analyze";

export class ExplainError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const CONNECT_TIMEOUT_MS = 5000;
const STATEMENT_TIMEOUT_MS = 5000;
const LOCK_TIMEOUT_MS = 2000;

type PgLikeError = { code?: string; message?: string };

function toExplainError(error: unknown): ExplainError {
  if (error instanceof ExplainError) return error;

  const err = error as PgLikeError;
  const code = err.code ?? "";
  const message = err.message ?? "";

  if (code === "28P01" || code === "28000") {
    return new ExplainError("Login failed. Check the user name and password");
  }
  if (code === "3D000") return new ExplainError("That database does not exist");

  // The query ran longer than statement_timeout
  if (code === "57014") {
    return new ExplainError(
      `The query took longer than ${STATEMENT_TIMEOUT_MS / 1000} seconds and was stopped`
    );
  }

  // The query tried to change data inside the READ ONLY transaction.
  // Example: SELECT my_function() where the function does an INSERT.
  if (code === "25006") {
    return new ExplainError(
      "This query tries to change data, so it was stopped. This tool only runs read-only queries"
    );
  }

  if (code === "55P03") {
    return new ExplainError(
      `The query waited more than ${LOCK_TIMEOUT_MS / 1000} seconds for a lock and was stopped`
    );
  }
  if (code === "53300") {
    return new ExplainError("The database has too many connections right now", 503);
  }

  // Class 42 = syntax errors and missing tables or columns.
  // These messages are about the user's own query, so they are safe to show.
  if (code.startsWith("42")) {
    return new ExplainError(message || "The query has an error");
  }

  if (code === "ECONNREFUSED") {
    return new ExplainError("The database refused the connection");
  }
  if (code === "ENOTFOUND") return new ExplainError("Could not find that host");

  // The server answered, but it does not speak SSL
  if (message.includes("does not support SSL")) {
    return new ExplainError(
      "This database does not accept SSL connections. Use a provider that supports SSL"
    );
  }

  if (
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "CERT_HAS_EXPIRED"
  ) {
    return new ExplainError(
      "The SSL certificate could not be verified. If your provider uses a self-signed certificate, add ?sslmode=no-verify to the connection string"
    );
  }

  if (
    code === "ETIMEDOUT" ||
    message.includes("timeout expired") ||
    message.includes("Connection terminated") ||
    message.includes("Query read timeout")
  ) {
    return new ExplainError("Could not connect to the database in time", 504);
  }

  console.error("explain failed:", code || message);
  return new ExplainError("Could not run the query on that database", 502);
}

export async function runExplain(
  target: ConnectionTarget,
  ip: string,
  sql: string,
  mode: ExplainMode = "explain"
): Promise<unknown> {
  const client = new Client({
    host: ip, // connect to the checked IP, not the host name
    port: target.port,
    user: target.user,
    password: target.password,
    database: target.database,
    ssl:
      target.sslMode === "disable"
        ? false
        : {
            // The certificate is checked against the real host name
            servername: net.isIP(target.host) ? undefined : target.host,
            rejectUnauthorized: target.sslMode === "verify",
          },
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    // Backup timer on our side, in case the server never answers
    query_timeout: STATEMENT_TIMEOUT_MS + 3000,
    application_name: "erd-tool-explain",
  });

  // Without this handler, a dropped connection can crash the server process
  client.on("error", () => {});

  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    await client.query(`SET LOCAL lock_timeout = ${LOCK_TIMEOUT_MS}`);

    const options =
      mode === "analyze" ? "ANALYZE, BUFFERS, FORMAT JSON" : "FORMAT JSON";
    const result = await client.query(`EXPLAIN (${options}) ${sql}`);
    return result.rows[0]?.["QUERY PLAN"] ?? null;
  } catch (error) {
    throw toExplainError(error);
  } finally {
    // ROLLBACK undoes anything the query did, even if something slipped through
    try {
      await client.query("ROLLBACK");
    } catch {
      // connection may already be closed
    }
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}