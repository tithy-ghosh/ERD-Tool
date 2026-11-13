

import type { ParsedPlan, PlanNode, RawPlanNode } from "../types/plan";

export class PlanParseError extends Error {}

// Protects the browser from a huge or hostile plan
const MAX_NODES = 2000;
const MAX_DEPTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

type Counter = { nodes: number };

function buildNode(
  raw: Record<string, unknown>,
  id: string,
  depth: number,
  counter: Counter
): PlanNode {
  if (depth > MAX_DEPTH) throw new PlanParseError("The plan is too deep");
  counter.nodes += 1;
  if (counter.nodes > MAX_NODES) throw new PlanParseError("The plan is too large");

  const nodeType = str(raw["Node Type"]);
  if (!nodeType) throw new PlanParseError(`Node ${id} has no "Node Type"`);

  const rawChildren = raw["Plans"] ?? [];
  if (!Array.isArray(rawChildren)) {
    throw new PlanParseError(`Node ${id} has a "Plans" value that is not a list`);
  }

  const children = rawChildren.map((child, index) => {
    if (!isRecord(child)) {
      throw new PlanParseError(`Node ${id}.${index} is not an object`);
    }
    return buildNode(child, `${id}.${index}`, depth + 1, counter);
  });

  // Cost (always there)
  const totalCost = num(raw["Total Cost"]) ?? 0;
  // For a Nested Loop the inner cost is "per loop", so this is a rough number
  const exclusiveCost = Math.max(
    0,
    totalCost - sum(children.map((child) => child.totalCost))
  );

  // Time (only after EXPLAIN ANALYZE)
  const actualLoops = num(raw["Actual Loops"]);
  const timePerLoop = num(raw["Actual Total Time"]);
  const totalTime =
    actualLoops !== null && timePerLoop !== null ? timePerLoop * actualLoops : null;
  const exclusiveTime =
    totalTime === null
      ? null
      : Math.max(0, totalTime - sum(children.map((child) => child.totalTime ?? 0)));

  // Keep everything else for the detail panel, but not the children again
  const rest: RawPlanNode = { ...raw };
  delete rest["Plans"];

  return {
    id,
    nodeType,
    parentRelationship: str(raw["Parent Relationship"]),
    relation: str(raw["Relation Name"]),
    alias: str(raw["Alias"]),
    indexName: str(raw["Index Name"]),
    joinType: str(raw["Join Type"]),
    filter: str(raw["Filter"]),
    indexCond: str(raw["Index Cond"]),
    estimatedRows: num(raw["Plan Rows"]) ?? 0,
    totalCost,
    exclusiveCost,
    actualRows: num(raw["Actual Rows"]),
    actualLoops,
    totalTime,
    exclusiveTime,
    percentOfTotal: null, // filled in once the root time is known
    rowsRemovedByFilter: num(raw["Rows Removed by Filter"]),
    children,
    raw: rest,
  };
}

function fillPercent(node: PlanNode, rootTime: number): void {
  if (node.exclusiveTime !== null) {
    node.percentOfTotal = rootTime > 0 ? (node.exclusiveTime / rootTime) * 100 : 0;
  }
  node.children.forEach((child) => fillPercent(child, rootTime));
}

/**
 * Accepts what Postgres returns: [ { "Plan": {...}, "Execution Time": 1.2 } ]
 * (the object inside the list is accepted too).
 */
export function parsePlan(input: unknown): ParsedPlan {
  const top = Array.isArray(input) ? input[0] : input;
  if (!isRecord(top) || !isRecord(top["Plan"])) {
    throw new PlanParseError('This is not a Postgres plan (no "Plan" found)');
  }

  const counter: Counter = { nodes: 0 };
  const root = buildNode(top["Plan"], "0", 0, counter);
  const hasActuals = root.totalTime !== null;

  if (hasActuals) fillPercent(root, root.totalTime ?? 0);

  return {
    root,
    hasActuals,
    planningTime: num(top["Planning Time"]),
    executionTime: num(top["Execution Time"]),
    nodeCount: counter.nodes,
  };
}

/** All nodes, parents before children (depth first) */
export function flattenPlan(root: PlanNode): PlanNode[] {
  const result: PlanNode[] = [];
  const visit = (node: PlanNode) => {
    result.push(node);
    node.children.forEach(visit);
  };
  visit(root);
  return result;
}

/** The node that used the most time itself (null for plain EXPLAIN) */
export function findSlowestNode(plan: ParsedPlan): PlanNode | null {
  if (!plan.hasActuals) return null;
  let slowest: PlanNode | null = null;
  for (const node of flattenPlan(plan.root)) {
    if (
      node.exclusiveTime !== null &&
      (slowest === null || node.exclusiveTime > (slowest.exclusiveTime ?? 0))
    ) {
      slowest = node;
    }
  }
  return slowest;
}