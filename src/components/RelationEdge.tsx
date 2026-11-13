"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { Settings2, Trash2 } from "lucide-react";
import type { ErdEdge, RelationType } from "@/types/erd";
import { useErdMode } from "@/components/erd/ErdMode";
import { useEditorUi } from "@/components/erd/EditorUi";
import { toast } from "@/components/ui/toast";
import { useErdStore } from "@/store/useErdStore";

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

const EDGE_COLOR = "#b1baad";
const EDGE_SELECTED = "#65a30d";

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
  const { readOnly } = useErdMode();
  const { openProperties } = useEditorUi();
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

  const handleDelete = () => {
    useErdStore.getState().deleteEdge(id);
    toast({
      title: "Relationship deleted",
      action: { label: "Undo", onClick: () => useErdStore.getState().undo() },
    });
  };

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
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="nodrag nopan pointer-events-auto absolute flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5 shadow-[0_6px_18px_-12px_rgba(33,38,32,0.4)]"
          >
            {readOnly ? (
              <span
                title={RELATION_TITLES[relationType]}
                className="px-1.5 py-1 text-[10px] font-semibold leading-none text-accent-strong"
              >
                {SHORT_LABELS[relationType]}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openProperties()}
                  title={RELATION_TITLES[relationType]}
                  className="rounded px-1.5 py-1 text-[10px] font-semibold leading-none text-accent-strong transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  {SHORT_LABELS[relationType]}
                </button>
                <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => openProperties()}
                  aria-label="Open relationship properties"
                  title="Relationship properties"
                  className="grid h-6 w-6 place-items-center rounded text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  <Settings2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label="Delete relationship"
                  title="Delete relationship"
                  className="grid h-6 w-6 place-items-center rounded text-ink-subtle transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
