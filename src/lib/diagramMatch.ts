// Matches relation names from a Postgres plan to tables on the ERD canvas.

import type { TableFlowNode } from "../types/erd";
import type { ParsedPlan, PlanNode } from "../types/plan";
import { flattenPlan } from "./planParser";

/** "public.Orders" and `"Orders"` both become "orders" */
export function normalizeTableName(name: string): string {
  const trimmed = name.trim().replace(/^"+|"+$/g, "");
  const dot = trimmed.lastIndexOf(".");
  const base = dot >= 0 ? trimmed.slice(dot + 1) : trimmed;
  return base.replace(/^"+|"+$/g, "").trim().toLowerCase();
}

/** Normalized names of every table currently on the canvas */
export function collectDiagramTableNames(tables: TableFlowNode[]): Set<string> {
  return new Set(tables.map((table) => normalizeTableName(table.data.name)));
}

/** Canvas node ids whose table matches the relation of one plan node */
export function diagramTableIdsForNode(
  node: PlanNode,
  tables: TableFlowNode[]
): string[] {
  if (!node.relation) return [];

  const target = normalizeTableName(node.relation);
  return tables
    .filter((table) => normalizeTableName(table.data.name) === target)
    .map((table) => table.id);
}

/** Canvas node ids for every table the plan touches, in canvas order */
export function diagramTableIdsForPlan(
  plan: ParsedPlan,
  tables: TableFlowNode[]
): string[] {
  const names = new Set(
    flattenPlan(plan.root).flatMap((node) =>
      node.relation ? [normalizeTableName(node.relation)] : []
    )
  );

  return tables
    .filter((table) => names.has(normalizeTableName(table.data.name)))
    .map((table) => table.id);
}
