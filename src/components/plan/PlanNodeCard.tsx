"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/cn";
import {
  describeNode,
  describeRows,
  formatMs,
  formatPercent,
  HEAT_COLORS,
  NODE_WIDTH,
  type PlanFlowNode,
} from "@/lib/planView";

// Handles are only there so React Flow can draw the lines. They are invisible.
const handleClass = "!h-1 !w-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

export default function PlanNodeCard({ data, selected }: NodeProps<PlanFlowNode>) {
  const { node, heatPercent, heatLevel, isTop, hasActuals } = data;
  const heat = HEAT_COLORS[heatLevel];
  const subtitle = describeNode(node);

  return (
    <div
      role="group"
      aria-label={`${node.nodeType}, ${formatPercent(heatPercent)} of the query`}
      className={cn(
        "rounded-lg border text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        selected && "ring-2 ring-primary/40"
      )}
      style={{ width: NODE_WIDTH, background: heat.bg, borderColor: heat.border }}
    >
      {/* Rows come in from the children (below) and leave to the parent (above) */}
      <Handle type="target" position={Position.Bottom} isConnectable={false} className={handleClass} />
      <Handle type="source" position={Position.Top} isConnectable={false} className={handleClass} />

      <div className="px-3 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold leading-tight">{node.nodeType}</p>
          {isTop ? (
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-white"
              style={{ background: heat.bar }}
            >
              {hasActuals ? "Slowest" : "Costliest"}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-muted" title={subtitle}>
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="px-3 pb-2.5 pt-2">
        <div className="flex items-baseline justify-between gap-2">
          {hasActuals && node.exclusiveTime !== null ? (
            <>
              <span className="text-[15px] font-semibold tabular-nums">
                {formatMs(node.exclusiveTime)}
              </span>
              <span className="text-[11px] tabular-nums text-ink-muted">
                own time · {formatPercent(heatPercent)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[15px] font-semibold tabular-nums">
                cost {node.exclusiveCost.toFixed(1)}
              </span>
              <span className="text-[11px] tabular-nums text-ink-muted">
                {formatPercent(heatPercent)} of plan
              </span>
            </>
          )}
        </div>

        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5" aria-hidden="true">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(heatPercent, 2))}%`,
              background: heat.bar,
            }}
          />
        </div>

        <p className="mt-1.5 truncate text-[11px] tabular-nums text-ink-muted">
          {describeRows(node, hasActuals)}
        </p>
      </div>
    </div>
  );
}