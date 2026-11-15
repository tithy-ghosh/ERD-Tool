# Plan fixtures

Real PostgreSQL 18.6 output for `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.
Each file is the plan behind one advice rule:

| File | What it shows |
| --- | --- |
| `seq-scan-rows-removed.json` | Seq Scan on `orders`; 58,800 rows removed by the `status` filter |
| `row-estimate-off.json` | `users` was never analyzed; estimated 233 rows, returned 4,000 |
| `sort-spill.json` | Sort on `events` spills to disk (`work_mem` was 64 kB) |
| `nested-loop-loops.json` | LATERAL join runs its inner index scan 5,000 times |
| `healthy-index-scan.json` | Primary key lookup; no rule fires |

To capture a new plan from your own read-only database, set `PLAN_DB_URL` in
`.env.local` and run:

```bash
npm run plan:capture -- my-plan analyze "select * from orders where status = 'paid'"
```

Then point a test at `src/lib/__fixtures__/plans/my-plan.json`.
