import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSql, MAX_SQL_CHARS } from "@/lib/explainSafety";
import {
  GuardError,
  parseConnectionString,
  resolveSafeAddress,
} from "@/lib/hostGuard";
import { ExplainError, runExplain } from "@/lib/explainRunner";
import { isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_CHARS = MAX_SQL_CHARS + 3000;

// Analyze really runs the query, so it gets a smaller limit than Explain
const LIMITS = {
  explain: 10,
  analyze: 5,
} as const;

const bodySchema = z.object({
  connectionString: z.string().min(10).max(2000),
  sql: z.string().min(1).max(MAX_SQL_CHARS),
  mode: z.enum(["explain", "analyze"]).default("explain"),
});

function json(body: unknown, status = 200) {
  // The response can contain the user's schema details, so never cache it
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  // 1. Feature switch: set EXPLAIN_ENABLED=true to turn this feature on
  if (process.env.EXPLAIN_ENABLED !== "true") {
    return json({ error: "The query plan feature is turned off" }, 503);
  }

  // 2. Read and validate the body
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) {
    return json({ error: "The request is too large" }, 413);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const body = bodySchema.safeParse(parsedJson);
  if (!body.success) {
    return json({ error: "Send a connection string and a query" }, 400);
  }
  const { connectionString, sql, mode } = body.data;

  // 3. Rate limit by IP (stored in the database), separate counter per mode
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    if (await isRateLimited(`${mode}:${ip}`, LIMITS[mode], 60)) {
      return json({ error: "Too many requests. Please wait a minute" }, 429);
    }
  } catch (error) {
    // If we cannot count requests, we do not allow the request (fail closed)
    console.error("rate limit check failed:", error);
    return json({ error: "The service is not available right now" }, 503);
  }

  // 4. Query safety check
  const safe = checkSql(sql);
  if (!safe.ok) return json({ error: safe.error }, 400);

  // 5. Connection string and host checks, then run EXPLAIN.
  //    Local hosts are allowed ONLY outside production and only when
  //    EXPLAIN_ALLOW_PRIVATE=true (for testing with a local database).
  const allowPrivate =
    process.env.NODE_ENV !== "production" &&
    process.env.EXPLAIN_ALLOW_PRIVATE === "true";

  try {
    const target = parseConnectionString(connectionString, allowPrivate);
    const address = await resolveSafeAddress(target.host, allowPrivate);
    const plan = await runExplain(target, address, safe.sql, mode);
    return json({ mode, plan });
  } catch (error) {
    if (error instanceof GuardError || error instanceof ExplainError) {
      return json({ error: error.message }, error.status);
    }
    // Never log the request body: it contains the database password
    console.error("explain route failed");
    return json({ error: "Something went wrong" }, 500);
  }
}