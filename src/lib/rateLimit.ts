import { getPrisma } from "@/lib/db";

// Fixed-window rate limit stored in the database, so every serverless
// instance sees the same counter (the in-memory version in /api/generate
// does not).
//
// Needs the RateLimit model in prisma/schema.prisma (run `npx prisma db push`).
export async function isRateLimited(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const prisma = getPrisma();

  // One atomic statement: start a new window if the old one is over,
  // otherwise add 1 to the counter.
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits ("key", "count", "window_start")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN rate_limits."window_start" < now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1
        ELSE rate_limits."count" + 1
      END,
      "window_start" = CASE
        WHEN rate_limits."window_start" < now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN now()
        ELSE rate_limits."window_start"
      END
    RETURNING "count"
  `;

  return Number(rows[0]?.count ?? 0) > maxRequests;
}
