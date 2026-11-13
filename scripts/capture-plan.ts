

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { checkSql } from "../src/lib/explainSafety";
import { parseConnectionString, resolveSafeAddress } from "../src/lib/hostGuard";
import { runExplain, type ExplainMode } from "../src/lib/explainRunner";

config({ path: ".env.local" });

const USAGE =
  'Usage: npm run plan:capture -- <name> <explain|analyze> "<sql>"';

async function main() {
  const [name, mode, sql] = process.argv.slice(2);
  const url = process.env.PLAN_DB_URL;

  if (!name || !sql || (mode !== "explain" && mode !== "analyze")) {
    throw new Error(USAGE);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error("The name may only use a-z, 0-9 and -");
  }
  if (!url) throw new Error("Set PLAN_DB_URL in .env.local first");

  const safe = checkSql(sql);
  if (!safe.ok) throw new Error(safe.error);

  const target = parseConnectionString(url, true);
  const address = await resolveSafeAddress(target.host, true);
  const plan = await runExplain(target, address, safe.sql, mode as ExplainMode);

  const dir = path.join("src", "lib", "__fixtures__", "plans");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  writeFileSync(file, JSON.stringify(plan, null, 2) + "\n");
  console.log(`Saved ${file}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});