// Everything the plan tree needs that is NOT React: heat colors, number
// formatting, tree layout, and the nodes/edges for React Flow.
// Kept separate from the components so it can be unit tested.

import type { Edge, Node } from "@xyflow/react";
import type { ParsedPlan, PlanNode } from "../types/plan";
import { findSlowestNode, flattenPlan } from "./planParser";



export type HeatLevel = 0 | 1 | 2 | 3 | 4;


export function heatLevel(percent: number): HeatLevel {
  if (percent >= 50) return 4;
  if (percent >= 30) return 3;
  if (percent >= 15) return 2;
  if (percent >= 5) return 1;
  return 0;
}


export const HEAT_COLORS: Record<
  HeatLevel,
  { bg: string; border: string; bar: string; label: string }
> = {
  0: { bg: "#ffffff", border: "#e5e7eb", bar: "#cbd5e1", label: "Under 5%" },
  1: { bg: "#fffbeb", border: "#fde68a", bar: "#fbbf24", label: "5% to 15%" },
  2: { bg: "#fff7ed", border: "#fdba74", bar: "#f97316", label: "15% to 30%" },
  3: { bg: "#fef2f2", border: "#fca5a5", bar: "#ef4444", label: "30% to 50%" },
  4: { bg: "#fee2e2", border: "#f87171", bar: "#b91c1c", label: "50% or more" },
};


export function heatPercents(plan: ParsedPlan): Map<string, number> {
  const nodes = flattenPlan(plan.root);
  const result = new Map<string, number>();

  if (plan.hasActuals) {
    for (const node of nodes) result.set(node.id, node.percentOfTotal ?? 0);
    return result;
  }

  const totalCost = nodes.reduce((acc, node) => acc + node.exclusiveCost, 0);
  for (const node of nodes) {
    result.set(node.id, totalCost > 0 ? (node.exclusiveCost / totalCost) * 100 : 0);
  }
  return result;
}



export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms >= 100) return `${Math.round(ms)} ms`;
  if (ms >= 0.01) return `${ms.toFixed(2)} ms`;
  if (ms > 0) return "<0.01 ms";
  return "0 ms";
}

export function formatRows(rows: number): string {
  return Math.round(rows).toLocaleString("en-US");
}

export function formatPercent(percent: number): string {
  if (percent <= 0) return "0%";
  if (percent < 0.1) return "<0.1%";
  return `${percent.toFixed(1)}%`;
}


export function describeNode(node: PlanNode): string | null {
  const alias =
    node.alias && node.alias !== node.relation ? ` (${node.alias})` : "";

  if (node.indexName && node.relation) {
    return `${node.indexName} on ${node.relation}${alias}`;
  }
  if (node.relation) return `on ${node.relation}${alias}`;
  if (node.indexName) return node.indexName;
  if (node.joinType) return `${node.joinType} join`;
  return null;
}


export function describeRows(node: PlanNode, hasActuals: boolean): string {
  const estimated = `est ${formatRows(node.estimatedRows)}`;
  if (!hasActuals || node.actualRows === null) return estimated;

  const loops = node.actualLoops ?? 1;
  const loopText = loops > 1 ? ` ×${formatRows(loops)} loops` : "";
  return `${estimated} · actual ${formatRows(node.actualRows)}${loopText}`;
}



export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 112;
const GAP_X = 32;
const GAP_Y = 64;


export function layoutPlan(root: PlanNode): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  let nextLeafX = 0;

  const place = (node: PlanNode, depth: number): number => {
    let x: number;
    if (node.children.length === 0) {
      x = nextLeafX;
      nextLeafX += NODE_WIDTH + GAP_X;
    } else {
      const childXs = node.children.map((child) => place(child, depth + 1));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }
    positions.set(node.id, { x, y: depth * (NODE_HEIGHT + GAP_Y) });
    return x;
  };

  place(root, 0);
  return positions;
}



export type PlanFlowData = {
  node: PlanNode;
  /** Share of the query for this node, 0 to 100 (time or cost) */
  heatPercent: number;
  heatLevel: HeatLevel;
  /** The node with the most time (or the most cost for plain EXPLAIN) */
  isTop: boolean;
  hasActuals: boolean;
};

export type PlanFlowNode = Node<PlanFlowData, "plan">;

export function buildPlanGraph(plan: ParsedPlan): {
  nodes: PlanFlowNode[];
  edges: Edge[];
} {
  const all = flattenPlan(plan.root);
  const percents = heatPercents(plan);
  const positions = layoutPlan(plan.root);

  // The top node: slowest after ANALYZE, otherwise the most expensive one
  let topId: string | null = null;
  if (plan.hasActuals) {
    topId = findSlowestNode(plan)?.id ?? null;
  } else {
    let best = 0;
    for (const node of all) {
      if (node.exclusiveCost > best) {
        best = node.exclusiveCost;
        topId = node.id;
      }
    }
  }

  const nodes: PlanFlowNode[] = all.map((node) => {
    const heatPercent = percents.get(node.id) ?? 0;
    return {
      id: node.id,
      type: "plan",
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      data: {
        node,
        heatPercent,
        heatLevel: heatLevel(heatPercent),
        isTop: node.id === topId,
        hasActuals: plan.hasActuals,
      },
      draggable: false,
      connectable: false,
    };
  });

 
  const edges: Edge[] = [];
  for (const parent of all) {
    for (const child of parent.children) {
      const rows = plan.hasActuals
        ? (child.actualRows ?? 0) * (child.actualLoops ?? 1)
        : child.estimatedRows;
      edges.push({
        id: `e-${child.id}`,
        source: child.id,
        target: parent.id,
        type: "smoothstep",
        label: `${formatRows(rows)} ${rows === 1 ? "row" : "rows"}`,
        style: { stroke: "#94a3b8", strokeWidth: 1 + Math.min(4, Math.log10(rows + 1)) },
        labelStyle: { fontSize: 11, fill: "#4b5563" },
        labelBgStyle: { fill: "#f7f8fa" },
      });
    }
  }

  return { nodes, edges };
}