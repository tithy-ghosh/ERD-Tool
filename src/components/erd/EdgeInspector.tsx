"use client";

import { Link2, Trash2 } from "lucide-react";
import { RELATION_OPTION_LABELS } from "@/components/RelationEdge";
import { RELATION_TYPES, type ErdEdge, type RelationType } from "@/types/erd";
import { cn } from "@/lib/cn";
import IconButton from "@/components/ui/IconButton";

type Props = {
  edge: ErdEdge;
  onChange: (type: RelationType) => void;
  onDelete: () => void;
};

export default function EdgeInspector({ edge, onChange, onDelete }: Props) {
  const current = edge.data?.relationType ?? "one-to-many";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-30 flex justify-center px-3 lg:bottom-24">
      <div className="pointer-events-auto w-full max-w-[340px] rounded-lg border border-line bg-surface p-3 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.4)] animate-soft-fade">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Link2 className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />
            Relationship
          </span>
          <IconButton
            icon={Trash2}
            label="Delete relationship"
            size="sm"
            tone="danger"
            onClick={onDelete}
            className="-mr-1 -mt-1"
          />
        </div>

        <div
          className="grid grid-cols-3 gap-1 rounded-md bg-surface-subtle p-1"
          role="group"
          aria-label="Relationship type"
        >
          {RELATION_TYPES.map((type) => {
            const active = current === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(type)}
                aria-pressed={active}
                className={cn(
                  "h-8 rounded px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active
                    ? "bg-surface text-primary shadow-sm"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {RELATION_OPTION_LABELS[type]}
              </button>
            );
          })}
        </div>

        <p className="mt-2 hidden text-[11px] text-ink-subtle lg:block">
          Press Backspace to delete this relationship.
        </p>
      </div>
    </div>
  );
}
