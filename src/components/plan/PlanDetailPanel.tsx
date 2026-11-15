"use client";

import type { ReactNode } from "react";
import { AlertTriangle, LocateFixed, X } from "lucide-react";
import {
  formatBlocks,
  formatKilobytes,
  readBufferUsage,
  readSortInfo,
} from "@/lib/planDetail";
import type { PlanAdvice } from "@/lib/planAdvice";
import Button from "@/components/ui/Button";
import {
  describeNode,
  formatMs,
  formatPercent,
  formatRows,
} from "@/lib/planView";
import {
  iconButtonBase,
  iconButtonSizes,
  sectionLabelClass,
} from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import type { PlanNode } from "@/types/plan";

const CONDITION_KEYS = [
  ["Filter", "Filter"],
  ["Index Cond", "Index condition"],
  ["Recheck Cond", "Recheck condition"],
  ["Join Filter", "Join filter"],
  ["Hash Cond", "Hash condition"],
  ["Merge Cond", "Merge condition"],
] as const;

function rawString(node: PlanNode, key: string): string | null {
  const value = node.raw[key];

  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value)) {
    const parts = value.filter((item): item is string => typeof item === "string");
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function rawNumber(node: PlanNode, key: string): number | null {
  const value = node.raw[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-ink-subtle">{label}</dt>
      <dd
        className="truncate font-medium tabular-nums text-ink"
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

type Props = {
  node: PlanNode;
  hasActuals: boolean;
  advice: PlanAdvice[];
  onClose: () => void;
  /** Only set when the node's table is on the diagram */
  onShowOnDiagram?: () => void;
};

export default function PlanDetailPanel({
  node,
  hasActuals,
  advice,
  onClose,
  onShowOnDiagram,
}: Props) {
  const buffers = readBufferUsage(node);
  const sort = readSortInfo(node);
  const subtitle = describeNode(node);
  const conditions = CONDITION_KEYS.flatMap(([key, label]) => {
    const value = rawString(node, key);
    return value ? [{ label, value }] : [];
  });

  const removedByFilter = node.rowsRemovedByFilter;
  const removedByJoin = rawNumber(node, "Rows Removed by Join Filter");
  const totalRemoved = (removedByFilter ?? 0) + (removedByJoin ?? 0);
  const removedPercent =
    totalRemoved > 0
      ? (totalRemoved /
          Math.max(1, totalRemoved + (node.actualRows ?? 0))) *
        100
      : 0;
  const sortKey = rawString(node, "Sort Key");

  return (
    <aside
      aria-label="Node details"
      className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-surface shadow-[-16px_0_40px_-30px_rgba(15,23,42,0.4)] md:static md:z-auto md:h-full md:w-[320px] md:max-w-none md:shrink-0 md:shadow-none"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-line bg-surface px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
            Selected node
          </p>
          <h3 className="truncate text-[13px] font-semibold text-ink">
            {node.nodeType}
          </h3>
          {subtitle ? (
            <p className="truncate text-[11px] text-ink-muted" title={subtitle}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          className={cn(iconButtonBase, iconButtonSizes.sm)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex flex-col gap-4 p-3">
        {onShowOnDiagram ? (
          <Button
            variant="secondary"
            size="sm"
            icon={LocateFixed}
            onClick={onShowOnDiagram}
            className="w-full"
          >
            Show on diagram
          </Button>
        ) : null}

        {advice.length > 0 ? (
          <section className="flex flex-col gap-2">
            {advice.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-warning/20 bg-warning-soft p-2.5"
              >
                <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-warning">
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {item.detail}
                </p>
                {item.sql ? (
                  <pre className="mt-1.5 overflow-x-auto rounded bg-surface px-2 py-1.5 font-mono text-[10px] leading-relaxed text-ink">
                    {item.sql}
                  </pre>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        <section>
          <h4 className={sectionLabelClass}>Measurements</h4>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            <Detail label="Estimated rows" value={formatRows(node.estimatedRows)} />
            <Detail
              label="Actual rows"
              value={
                node.actualRows !== null ? formatRows(node.actualRows) : "–"
              }
            />
            {node.actualLoops !== null && node.actualLoops > 1 ? (
              <Detail label="Loops" value={formatRows(node.actualLoops)} />
            ) : null}
            <Detail label="Total cost" value={node.totalCost.toFixed(1)} />
            <Detail label="Own cost" value={node.exclusiveCost.toFixed(1)} />
            {hasActuals ? (
              <Detail
                label="Own time"
                value={
                  node.exclusiveTime !== null ? formatMs(node.exclusiveTime) : "–"
                }
              />
            ) : null}
            {hasActuals ? (
              <Detail
                label="Total time"
                value={node.totalTime !== null ? formatMs(node.totalTime) : "–"}
              />
            ) : null}
            {hasActuals && node.percentOfTotal !== null ? (
              <Detail
                label="Share of time"
                value={formatPercent(node.percentOfTotal)}
              />
            ) : null}
          </dl>
        </section>

        {totalRemoved > 0 ? (
          <section>
            <h4 className={sectionLabelClass}>Rows removed</h4>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              {removedByFilter !== null ? (
                <Detail
                  label="By filter"
                  value={formatRows(removedByFilter)}
                />
              ) : null}
              {removedByJoin !== null ? (
                <Detail label="By join" value={formatRows(removedByJoin)} />
              ) : null}
              <Detail
                label="Share discarded"
                value={formatPercent(removedPercent)}
              />
            </dl>
          </section>
        ) : null}

        {conditions.length > 0 ? (
          <section>
            <h4 className={sectionLabelClass}>Conditions</h4>
            <dl className="mt-2 flex flex-col gap-2">
              {conditions.map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] text-ink-subtle">{item.label}</dt>
                  <dd className="mt-0.5 break-words font-mono text-[10px] leading-relaxed text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {sort ? (
          <section>
            <h4 className={sectionLabelClass}>Sort</h4>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              {sort.method ? <Detail label="Method" value={sort.method} /> : null}
              {sort.spaceType ? (
                <Detail label="Space type" value={sort.spaceType} />
              ) : null}
              {sort.spaceKb !== null ? (
                <Detail label="Space used" value={formatKilobytes(sort.spaceKb)} />
              ) : null}
            </dl>
            {sortKey ? (
              <p className="mt-2 break-words font-mono text-[10px] leading-relaxed text-ink-muted">
                Sort key: {sortKey}
              </p>
            ) : null}
          </section>
        ) : null}

        {buffers ? (
          <section>
            <h4 className={sectionLabelClass}>Buffers</h4>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              <Detail label="Shared hit" value={formatBlocks(buffers.sharedHit)} />
              <Detail
                label="Shared read"
                value={formatBlocks(buffers.sharedRead)}
              />
              <Detail
                label="Shared dirtied"
                value={formatBlocks(buffers.sharedDirtied)}
              />
              <Detail
                label="Shared written"
                value={formatBlocks(buffers.sharedWritten)}
              />
              <Detail label="Temp read" value={formatBlocks(buffers.tempRead)} />
              <Detail
                label="Temp written"
                value={formatBlocks(buffers.tempWritten)}
              />
            </dl>
          </section>
        ) : null}

        <details className="rounded-md border border-line bg-surface-subtle px-2.5 py-2">
          <summary className="cursor-pointer text-[11px] font-medium text-ink-muted">
            Raw plan node
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto font-mono text-[10px] leading-relaxed text-ink-muted">
            {JSON.stringify(node.raw, null, 2)}
          </pre>
        </details>
      </div>
    </aside>
  );
}
