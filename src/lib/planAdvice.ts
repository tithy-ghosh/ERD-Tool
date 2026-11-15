// Rule-based advice for a parsed Postgres plan. There is no AI here: every
// rule uses one fixed threshold, so the same plan always gives the same advice.

import type { ParsedPlan, PlanNode } from "../types/plan";
import { flattenPlan } from "./planParser";

export type AdviceRule =
  | "seq-scan-rows-removed"
  | "row-estimate"
  | "sort-spill"
  | "nested-loop-loops";

export type AdviceSeverity = "info" | "warning";

export type PlanAdvice = {
  /** Unique per rule and node */
  id: string;
  rule: AdviceRule;
  severity: AdviceSeverity;
  /** The node the advice is about, so the UI can focus it */
  nodeId: string;
  title: string;
  detail: string;
  /** Copyable SQL, only when the plan gives us enough detail */
  sql?: string;
};

// One place for every threshold, so tests and the UI cannot drift apart
export const ADVICE_LIMITS = {
  seqScanMinRowsRemoved: 1000,
  seqScanRemovedRatio: 10,
  estimateRatio: 10,
  nestedLoopMinLoops: 1000,
} as const;

const SQL_KEYWORDS = new Set([
  "and",
  "or",
  "not",
  "is",
  "in",
  "like",
  "ilike",
  "between",
  "null",
  "true",
  "false",
  "any",
  "all",
  "some",
  "case",
  "when",
  "then",
  "else",
  "end",
  "array",
  "row",
  "now",
  "current_date",
  "current_timestamp",
]);

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function count(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatSizeKb(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} kB`;
}

function formatFactor(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  return `${Math.round(value).toLocaleString("en-US")}×`;
}

function quoteIdent(name: string): string {
  return /^[a-z_][a-z0-9_$]*$/.test(name)
    ? name
    : `"${name.replace(/"/g, '""')}"`;
}

/**
 * Best effort: pull column names out of a filter like
 * "((status)::text = 'paid'::text)". If the shape is unusual we return no
 * columns and the advice stays generic instead of writing a wrong index.
 */
export function filterColumns(filter: string | null): string[] {
  if (!filter) return [];

  const columns: string[] = [];
  const pattern =
    /(?:"([^"]+)"|(?<!:)\b([a-z_][a-z0-9_$]*)\b)\)*(?:::[a-zA-Z_][\w.[\]"]*)?\s*(?:=|<>|!=|>=|<=|>|<|~~\*?|!~~\*?)\s*/gi;

  for (const match of filter.matchAll(pattern)) {
    const name = match[1] ?? match[2];
    if (!name || SQL_KEYWORDS.has(name.toLowerCase())) continue;
    if (!columns.includes(name)) columns.push(name);
    if (columns.length === 3) break;
  }

  return columns;
}

function seqScanAdvice(node: PlanNode): PlanAdvice | null {
  if (node.nodeType !== "Seq Scan" || node.actualRows === null) return null;

  const removed = node.rowsRemovedByFilter ?? 0;
  if (removed < ADVICE_LIMITS.seqScanMinRowsRemoved) return null;
  if (removed < ADVICE_LIMITS.seqScanRemovedRatio * Math.max(1, node.actualRows)) {
    return null;
  }

  const relation = node.relation;
  const columns = filterColumns(node.filter);
  const removedPercent = Math.round(
    (removed / Math.max(1, removed + node.actualRows)) * 100
  );

  return {
    id: `seq-scan-rows-removed:${node.id}`,
    rule: "seq-scan-rows-removed",
    severity: "warning",
    nodeId: node.id,
    title: relation
      ? `Index may help this Seq Scan on ${relation}`
      : "Index may help this Seq Scan",
    detail: `This scan returned ${count(node.actualRows)} rows and discarded ${count(
      removed
    )} (${removedPercent}%). ${
      columns.length > 0
        ? `An index on ${columns.join(", ")} could let Postgres read only the matching rows.`
        : "An index on the columns in this filter could let Postgres read only the matching rows."
    }`,
    sql:
      relation && columns.length > 0
        ? `CREATE INDEX ON ${quoteIdent(relation)} (${columns
            .map(quoteIdent)
            .join(", ")});`
        : undefined,
  };
}

type EstimateCandidate = {
  relation: string;
  nodeId: string;
  factor: number;
  advice: PlanAdvice;
};

function estimateAdvice(node: PlanNode): EstimateCandidate | null {
  if (!node.relation || node.actualRows === null) return null;

  const estimated = node.estimatedRows;
  const actual = node.actualRows;
  if (estimated === 0 && actual === 0) return null;

  const ratio = estimated > 0 ? actual / estimated : Infinity;
  if (
    ratio < ADVICE_LIMITS.estimateRatio &&
    ratio > 1 / ADVICE_LIMITS.estimateRatio
  ) {
    return null;
  }

  const tooLow = ratio >= 1;
  const factor = tooLow ? ratio : 1 / ratio;
  const finiteFactor = Number.isFinite(factor);
  const relation = node.relation;
  const factorText = finiteFactor ? formatFactor(factor) : "";

  return {
    relation,
    nodeId: node.id,
    factor,
    advice: {
      id: `row-estimate:${node.id}`,
      rule: "row-estimate",
      severity: "warning",
      nodeId: node.id,
      title: finiteFactor
        ? `Row estimate on ${relation} is ${factorText} too ${
            tooLow ? "low" : "high"
          }`
        : `Row estimate on ${relation} is far too ${
            tooLow ? "low" : "high"
          }`,
      detail:
        actual === 0
          ? `Postgres expected ${count(
              estimated
            )} rows but got none. Run ANALYZE ${quoteIdent(
              relation
            )} so the planner has fresh statistics.`
          : estimated === 0
            ? `Postgres expected no rows but got ${count(
                actual
              )}. Run ANALYZE ${quoteIdent(
                relation
              )} so the planner has fresh statistics.`
            : `Postgres expected ${count(estimated)} ${
                estimated === 1 ? "row" : "rows"
              } but got ${count(actual)} (${factorText} ${
                tooLow ? "more" : "fewer"
              }). Run ANALYZE ${quoteIdent(
                relation
              )} so the planner has fresh statistics.`,
      sql: `ANALYZE ${quoteIdent(relation)};`,
    },
  };
}

function sortAdvice(node: PlanNode): PlanAdvice | null {
  const method = stringValue(node.raw["Sort Method"]);
  const spaceType = stringValue(node.raw["Sort Space Type"]);
  const spaceKb = numberValue(node.raw["Sort Space Used"]);

  const external = method?.toLowerCase().includes("external") ?? false;
  const onDisk = spaceType?.toLowerCase() === "disk";
  if (!external && !onDisk) return null;

  const targetMb =
    spaceKb !== null && spaceKb > 0
      ? Math.max(1, Math.ceil((spaceKb * 2) / 1024))
      : null;

  return {
    id: `sort-spill:${node.id}`,
    rule: "sort-spill",
    severity: "warning",
    nodeId: node.id,
    title: "Sort spilled to disk",
    detail: `This sort ${
      method ? `ran with ${method}` : "ran on disk"
    }${spaceKb !== null ? ` and used ${formatSizeKb(spaceKb)} of disk` : ""}. Raise work_mem for this query and run Analyze again. work_mem applies to each sort, so raise it a little at a time.`,
    sql: targetMb !== null ? `SET work_mem = '${targetMb}MB';` : undefined,
  };
}

function nestedLoopAdvice(node: PlanNode): PlanAdvice | null {
  if (node.nodeType !== "Nested Loop" || node.children.length === 0) return null;

  let inner: PlanNode | null = null;
  for (const child of node.children) {
    const loops = child.actualLoops ?? 0;
    if (loops < ADVICE_LIMITS.nestedLoopMinLoops) continue;
    if (!inner || loops > (inner.actualLoops ?? 0)) inner = child;
  }
  if (!inner) return null;

  const loops = inner.actualLoops ?? 0;
  const label = inner.relation
    ? `${inner.nodeType} on ${inner.relation}`
    : inner.nodeType;
  const hasIndex = Boolean(inner.indexName || inner.indexCond);

  return {
    id: `nested-loop-loops:${inner.id}`,
    rule: "nested-loop-loops",
    severity: "warning",
    nodeId: inner.id,
    title: `Nested Loop inner side runs ${count(loops)} times`,
    detail: `The ${label} is executed once per outer row. ${
      hasIndex
        ? "It uses an index, but this many loops may still be slower than a Hash Join."
        : "There is no index condition on the join key, so every loop scans the table. Add an index on the join column, or let Postgres use a Hash Join."
    }`,
  };
}

export function buildAdvice(plan: ParsedPlan): PlanAdvice[] {
  const nodes = flattenPlan(plan.root);

  // One ANALYZE suggestion per table: keep the node with the worst estimate
  const estimates = new Map<string, EstimateCandidate>();
  for (const node of nodes) {
    const candidate = estimateAdvice(node);
    if (!candidate) continue;
    const current = estimates.get(candidate.relation);
    if (!current || candidate.factor > current.factor) {
      estimates.set(candidate.relation, candidate);
    }
  }
  const estimateByNode = new Map<string, PlanAdvice>();
  for (const candidate of estimates.values()) {
    estimateByNode.set(candidate.nodeId, candidate.advice);
  }

  const advice: PlanAdvice[] = [];
  for (const node of nodes) {
    const seq = seqScanAdvice(node);
    if (seq) advice.push(seq);

    const estimate = estimateByNode.get(node.id);
    if (estimate) advice.push(estimate);

    const sort = sortAdvice(node);
    if (sort) advice.push(sort);

    const nested = nestedLoopAdvice(node);
    if (nested) advice.push(nested);
  }

  return advice;
}

/** Advice for one node, used by the node detail panel */
export function adviceForNode(
  advice: PlanAdvice[],
  nodeId: string
): PlanAdvice[] {
  return advice.filter((item) => item.nodeId === nodeId);
}
