import assert from "node:assert/strict";
import test from "node:test";
import { buildAdvice, filterColumns } from "./planAdvice";
import { parsePlan } from "./planParser";
import healthyIndexScan from "./__fixtures__/plans/healthy-index-scan.json";
import nestedLoopLoops from "./__fixtures__/plans/nested-loop-loops.json";
import rowEstimateOff from "./__fixtures__/plans/row-estimate-off.json";
import seqScanRowsRemoved from "./__fixtures__/plans/seq-scan-rows-removed.json";
import sortSpill from "./__fixtures__/plans/sort-spill.json";

test("seq scan that discards most rows suggests an index", () => {
  const advice = buildAdvice(parsePlan(seqScanRowsRemoved));

  assert.equal(advice.length, 1);
  const [item] = advice;
  assert.equal(item.rule, "seq-scan-rows-removed");
  assert.equal(item.nodeId, "0");
  assert.equal(item.sql, "CREATE INDEX ON orders (status);");
  assert.match(item.title, /orders/);
  assert.match(item.detail, /58,800/);
});

test("bad row estimate suggests ANALYZE once per table", () => {
  const advice = buildAdvice(parsePlan(rowEstimateOff));

  assert.equal(advice.length, 1);
  const [item] = advice;
  assert.equal(item.rule, "row-estimate");
  assert.equal(item.nodeId, "0");
  assert.equal(item.sql, "ANALYZE users;");
  assert.match(item.title, /17× too low/);
  assert.match(item.detail, /17× more/);
});

test("external sort suggests a larger work_mem", () => {
  const advice = buildAdvice(parsePlan(sortSpill));

  assert.equal(advice.length, 1);
  const [item] = advice;
  assert.equal(item.rule, "sort-spill");
  assert.equal(item.nodeId, "0");
  assert.equal(item.sql, "SET work_mem = '4MB';");
  assert.match(item.detail, /1.9 MB/);
});

test("nested loop with many inner loops adds a warning", () => {
  const advice = buildAdvice(parsePlan(nestedLoopLoops));

  assert.equal(advice.length, 1);
  const [item] = advice;
  assert.equal(item.rule, "nested-loop-loops");
  assert.equal(item.nodeId, "0.1");
  assert.match(item.title, /5,000 times/);
  assert.match(item.detail, /Hash Join/);
});

test("a healthy plan gets no advice", () => {
  assert.deepEqual(buildAdvice(parsePlan(healthyIndexScan)), []);
});

test("plain EXPLAIN cannot trigger rules that need actual rows", () => {
  const plan = parsePlan({
    Plan: {
      "Node Type": "Seq Scan",
      "Relation Name": "orders",
      "Plan Rows": 1000,
      "Total Cost": 100,
      Filter: "(status = 'cancelled'::text)",
    },
    "Planning Time": 0.1,
  });

  assert.deepEqual(buildAdvice(plan), []);
});

test("a zero estimate gets a clear message", () => {
  const plan = parsePlan({
    Plan: {
      "Node Type": "Seq Scan",
      "Relation Name": "orders",
      "Plan Rows": 0,
      "Total Cost": 1,
      "Actual Rows": 50,
      "Actual Loops": 1,
      "Actual Total Time": 1.2,
    },
  });

  const [item] = buildAdvice(plan);
  assert.equal(item.rule, "row-estimate");
  assert.match(item.title, /far too low/);
  assert.match(item.detail, /expected no rows but got 50/);
});

test("filterColumns reads simple filters and ignores casts and keywords", () => {
  assert.deepEqual(filterColumns("((status)::text = 'paid'::text)"), ["status"]);
  assert.deepEqual(
    filterColumns("((created_at > '2025-01-01'::date) AND (tenant_id = 7))"),
    ["created_at", "tenant_id"]
  );
  assert.deepEqual(filterColumns("lower(email) = 'a@b.com'"), ["email"]);
  assert.deepEqual(filterColumns('("UserId" = 5)'), ["UserId"]);
  assert.deepEqual(filterColumns(null), []);
});
