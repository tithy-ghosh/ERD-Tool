"use client";

import {
  ChevronDown,
  CornerDownRight,
  KeyRound,
  Link2,
  Trash2,
} from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import {
  COLUMN_TYPES,
  type Column,
  type ColumnType,
} from "@/types/erd";
import { cn } from "@/lib/cn";
import { useErdMode } from "@/components/erd/ErdMode";

export type RefOption = {
  value: string;
  columnId: string;
  label: string;
};

type Props = {
  tableId: string;
  column: Column;
  refOptions: RefOption[];
};

const fieldClass =
  "nodrag erd-field bg-transparent outline-none transition-colors";

export default function TableColumnRow({
  tableId,
  column: col,
  refOptions,
}: Props) {
  const updateColumn = useErdStore((state) => state.updateColumn);
  const deleteColumn = useErdStore((state) => state.deleteColumn);
  const { readOnly } = useErdMode();

  const options = refOptions.filter((option) => option.columnId !== col.id);
  const current = col.references
    ? `${col.references.tableId}:${col.references.columnId}`
    : "";
  const selectValue = options.some((option) => option.value === current)
    ? current
    : "";
  const referenceLabel =
    options.find((option) => option.value === selectValue)?.label ?? "Select…";

  return (
    <div className="group/row border-b border-line px-2.5 py-1.5 transition-colors last:border-b-0 hover:bg-surface-subtle focus-within:bg-surface-subtle">
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-1">
        <button
          type="button"
          onClick={() =>
            updateColumn(tableId, col.id, {
              isPrimaryKey: !col.isPrimaryKey,
            })
          }
          disabled={readOnly}
          aria-pressed={col.isPrimaryKey}
          aria-label={`Toggle primary key for ${col.name}`}
          title="Primary key"
          className={cn(
            "nodrag grid h-6 w-6 shrink-0 place-items-center rounded border transition-colors disabled:cursor-default",
            col.isPrimaryKey
              ? "border-pk/30 bg-pk-soft text-pk"
              : "border-transparent text-ink-subtle hover:border-line hover:bg-surface hover:text-ink",
            !col.isPrimaryKey &&
              !readOnly &&
              "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100"
          )}
        >
          <KeyRound className="h-3 w-3" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() =>
            updateColumn(tableId, col.id, {
              isForeignKey: !col.isForeignKey,
              references: null,
            })
          }
          disabled={readOnly}
          aria-pressed={col.isForeignKey}
          aria-label={`Toggle foreign key for ${col.name}`}
          title="Foreign key"
          className={cn(
            "nodrag grid h-6 w-6 shrink-0 place-items-center rounded border transition-colors disabled:cursor-default",
            col.isForeignKey
              ? "border-fk/30 bg-fk-soft text-fk"
              : "border-transparent text-ink-subtle hover:border-line hover:bg-surface hover:text-ink",
            !col.isForeignKey &&
              !readOnly &&
              "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100"
          )}
        >
          <Link2 className="h-3 w-3" aria-hidden="true" />
        </button>

        <input
          value={col.name}
          onChange={(event) =>
            updateColumn(tableId, col.id, { name: event.target.value })
          }
          readOnly={readOnly}
          aria-label={`Column name for ${col.name}`}
          className={cn(
            fieldClass,
            "min-w-0 rounded border-b border-transparent px-1 py-1 text-[12.5px] text-ink read-only:cursor-default hover:border-line focus:border-primary focus:bg-surface focus-visible:ring-0"
          )}
        />

        {readOnly ? (
          <span className="w-[88px] shrink-0 px-1 font-mono text-[11px] text-ink-muted">
            {col.type}
          </span>
        ) : (
          <div className="relative shrink-0">
            <select
              value={col.type}
              onChange={(event) =>
                updateColumn(tableId, col.id, {
                  type: event.target.value as ColumnType,
                })
              }
              aria-label={`Column type for ${col.name}`}
              className="nodrag erd-field h-7 w-[88px] appearance-none rounded border border-transparent bg-transparent pl-1 pr-5 font-mono text-[11px] text-ink-muted outline-none transition-colors hover:border-line focus:border-primary focus:bg-surface focus-visible:ring-0"
            >
              {COLUMN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-subtle"
            />
          </div>
        )}

        {!readOnly ? (
          <button
            type="button"
            onClick={() => deleteColumn(tableId, col.id)}
            aria-label={`Delete column ${col.name}`}
            title="Delete column"
            className="nodrag grid h-6 w-6 shrink-0 place-items-center rounded border border-transparent text-ink-subtle opacity-0 transition-colors hover:border-line hover:bg-surface hover:text-danger group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        ) : (
          <span className="h-6 w-6" aria-hidden="true" />
        )}
      </div>

      {col.isForeignKey ? (
        <div className="ml-[52px] mt-1.5 flex items-center gap-1.5 border-l border-fk/30 pl-2 text-[11px]">
          <CornerDownRight
            aria-hidden="true"
            className="h-3 w-3 shrink-0 text-fk/70"
          />
          {readOnly ? (
            <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-fk">
              {referenceLabel}
            </span>
          ) : (
            <div className="relative min-w-0 flex-1">
              <select
                value={selectValue}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) {
                    updateColumn(tableId, col.id, { references: null });
                    return;
                  }
                  const [tableIdRef, columnId] = value.split(":");
                  updateColumn(tableId, col.id, {
                    references: { tableId: tableIdRef, columnId },
                  });
                }}
                aria-label={`Referenced column for ${col.name}`}
                className="nodrag erd-field h-6 w-full appearance-none rounded border-b border-line bg-transparent pl-1 pr-5 font-mono text-[10.5px] text-fk outline-none transition-colors hover:border-ink focus:border-primary focus:bg-surface focus-visible:ring-0"
              >
                <option value="">Select…</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-0.5 top-1/2 h-3 w-3 -translate-y-1/2 text-fk/70"
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
