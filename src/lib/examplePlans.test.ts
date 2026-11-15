import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTableName } from "./diagramMatch";
import { EXAMPLE_PLANS } from "./examplePlans";
import { buildAdvice } from "./planAdvice";
import { flattenPlan, parsePlan } from "./planParser";

// The built-in E-commerce diagram uses these table names
const EXAMPLE_TABLES = new Set(["customers", "orders", "order_items"]);

test("every sample plan is a valid analyzed plan with advice", () => {
  const ids = new Set<string>();

  for (const example of EXAMPLE_PLANS) {
    assert.ok(example.id.length > 0);
    assert.ok(!ids.has(example.id), `duplicate id: ${example.id}`);
    ids.add(example.id);

    assert.ok(example.label.length > 0);
    assert.ok(example.description.length > 0);

    const plan = parsePlan(example.plan);
    assert.equal(plan.hasActuals, true);
    assert.ok(plan.nodeCount >= 1 && plan.nodeCount <= 6);

    const advice = buildAdvice(plan);
    assert.ok(advice.length > 0, `${example.id} should show at least one tip`);

    const relations = flattenPlan(plan.root).flatMap((node) =>
      node.relation ? [normalizeTableName(node.relation)] : []
    );
    assert.ok(relations.length > 0);
    for (const relation of relations) {
      assert.ok(
        EXAMPLE_TABLES.has(relation),
        `${example.id} uses ${relation}, which is not in the E-commerce example`
      );
    }
  }
});

test("sample plans include single-table and multi-table queries", () => {
  assert.ok(EXAMPLE_PLANS.length >= 2 && EXAMPLE_PLANS.length <= 3);

  const relationCounts = EXAMPLE_PLANS.map((example) => {
    const plan = parsePlan(example.plan);
    return new Set(
      flattenPlan(plan.root).flatMap((node) =>
        node.relation ? [normalizeTableName(node.relation)] : []
      )
    ).size;
  });

  assert.ok(relationCounts.includes(1));
  assert.ok(relationCounts.some((count) => count > 1));
});
