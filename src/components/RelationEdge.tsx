"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { ErdEdge, RelationType } from "@/types/erd";

const SHORT_LABELS: Record<RelationType, string> = {
  "one-to-one": "1:1",
  "one-to-many": "1:N",
  "many-to-many": "N:N",
};

export const RELATION_OPTION_LABELS: Record<RelationType, string> = {
  "one-to-one": "One-to-one",
  "one-to-many": "One-to-many",
  "many-to-many": "Many-to-many",
};

export const RELATION_TITLES: Record<RelationType, string> = {
  "one-to-one": "One-to-one relationship",
  "one-to-many": "One-to-many relationship",
  "many-to-many": "Many-to-many relationship",
};

const EDGE_COLOR = "#94a3b8";
const EDGE_SELECTED = "#2563eb";

export default function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<ErdEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: 24,
  });

  const relationType: RelationType = data?.relationType ?? "one-to-many";
  const stroke = selected ? EDGE_SELECTED : EDGE_COLOR;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={22}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected ? 2 : 1.5,
          transition: "stroke 120ms ease, stroke-width 120ms ease",
        }}
      />
      {selected ? (
        <EdgeLabelRenderer>
          <div
            title={RELATION_TITLES[relationType]}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="pointer-events-none absolute rounded border border-primary bg-surface px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary shadow-sm"
          >
            {SHORT_LABELS[relationType]}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
