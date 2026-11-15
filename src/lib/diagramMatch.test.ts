import assert from "node:assert/strict";
import test from "node:test";
import type { TableFlowNode } from "../types/erd";
import {
  collectDiagramTableNames,
  diagramTableIdsForNode,
  diagramTableIdsForPlan,
  normalizeTableName,
} from "./diagramMatch";
import { parsePlan } from "./planParser";
import { buildPlanGraph } from "./planView";

function table(id: string, name: string): TableFlowNode {
  return {
    id,
    type: "table",
    position: { x: 0, y: 0 },
    data: { name, columns: [] },
  };
}

const tables = [
  table("t-orders", "Orders"),
  table("t-items", "order_items"),
  table("t-users", "users"),
];

const plan = parsePlan({
  Plan: {
    "Node Type": "Nested Loop",
    "Plan Rows": 10,
    "Total Cost": 40,
    Plans: [
      {
        "Node Type": "Seq Scan",
        "Relation Name": "public.orders",
        "Plan Rows": 10,
        "Total Cost": 20,
      },
      {
        "Node Type": "Index Scan",
        "Index Name": "order_items_pkey",
        "Relation Name": '"order_items"',
        "Plan Rows": 1,
        "Total Cost": 5,
      },
    ],
  },
});

test("normalizes quoted and schema-qualified names", () => {
  assert.equal(normalizeTableName("public.Orders"), "orders");
  assert.equal(normalizeTableName('"Orders"'), "orders");
  assert.equal(normalizeTableName('"public"."Order_Items"'), "order_items");
  assert.equal(normalizeTableName("  order_items  "), "order_items");
});

test("collects normalized table names from the canvas", () => {
  assert.deepEqual([...collectDiagramTableNames(tables)].sort(), [
    "order_items",
    "orders",
    "users",
  ]);
});

test("finds the canvas ids for a plan node", () => {
  assert.deepEqual(diagramTableIdsForNode(plan.root.children[0], tables), [
    "t-orders",
  ]);
  assert.deepEqual(diagramTableIdsForNode(plan.root.children[1], tables), [
    "t-items",
  ]);
  assert.deepEqual(diagramTableIdsForNode(plan.root, tables), []);
});

test("finds every canvas table touched by a plan", () => {
  assert.deepEqual(diagramTableIdsForPlan(plan, tables), [
    "t-orders",
    "t-items",
  ]);
});

test("buildPlanGraph marks matching relations", () => {
  const graph = buildPlanGraph(plan, collectDiagramTableNames(tables));
  const flags = new Map(
    graph.nodes.map((node) => [node.data.node.id, node.data.inDiagram])
  );

  assert.equal(flags.get("0"), false);
  assert.equal(flags.get("0.0"), true);
  assert.equal(flags.get("0.1"), true);
});
