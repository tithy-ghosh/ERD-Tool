"use client";

import {
  ArrowRight,
  Copy,
  KeyRound,
  Link2,
  Plus,
  Settings2,
  Table2,
  Trash2,
  Waypoints,
} from "lucide-react";
import PanelShell from "@/components/PanelShell";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { fieldClass, sectionLabelClass } from "@/components/ui/styles";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useErdStore } from "@/store/useErdStore";
import {
  RELATION_OPTION_LABELS,
  RELATION_TITLES,
} from "@/components/RelationEdge";
import {
  RELATION_TYPES,
  type ErdEdge,
  type RelationType,
  type TableFlowNode,
} from "@/types/erd";
import { confirmDeleteTable } from "./tableActions";

type Props = {
  table: TableFlowNode | null;
  edge: ErdEdge | null;
  onClose: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className={sectionLabelClass}>{children}</h3>;
}

export default function PropertiesPanel({ table, edge, onClose }: Props) {
  const nodes = useErdStore((state) => state.nodes);
  const edgeCount = useErdStore((state) => state.edges.length);
  const addTable = useErdStore((state) => state.addTable);
  const addColumn = useErdStore((state) => state.addColumn);
  const duplicateTable = useErdStore((state) => state.duplicateTable);
  const renameTable = useErdStore((state) => state.renameTable);
  const setRelationType = useErdStore((state) => state.setRelationType);
  const deleteEdge = useErdStore((state) => state.deleteEdge);
  const undo = useErdStore((state) => state.undo);

  if (edge) {
    const current = edge.data?.relationType ?? "one-to-many";
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);

    const handleDelete = () => {
      deleteEdge(edge.id);
      toast({
        title: "Relationship deleted",
        action: { label: "Undo", onClick: undo },
      });
    };

    return (
      <PanelShell
        title="Relationship"
        eyebrow={RELATION_TITLES[current]}
        icon={<Waypoints className="h-4 w-4" />}
        onClose={onClose}
      >
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>Relation type</SectionLabel>
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
                    onClick={() =>
                      setRelationType(edge.id, type as RelationType)
                    }
                    aria-pressed={active}
                    className={cn(
                      "h-8 rounded px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      active
                        ? "bg-surface text-accent-strong shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    )}
                  >
                    {RELATION_OPTION_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <SectionLabel>Connects</SectionLabel>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface-subtle p-2.5 text-xs">
              <span className="min-w-0 flex-1 truncate font-medium text-ink">
                {source?.data.name ?? "Unknown table"}
              </span>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 text-ink-subtle"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-right font-medium text-ink">
                {target?.data.name ?? "Unknown table"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Press Backspace while the relationship is selected to remove it.
            </p>
          </div>

          <div className="border-t border-line pt-4">
            <Button
              variant="outlineDanger"
              icon={Trash2}
              onClick={handleDelete}
              className="w-full"
            >
              Delete relationship
            </Button>
          </div>
        </div>
      </PanelShell>
    );
  }

  if (table) {
    return (
      <PanelShell
        title="Table properties"
        eyebrow={table.data.name || "Untitled table"}
        icon={<Table2 className="h-4 w-4" />}
        onClose={onClose}
      >
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Name</SectionLabel>
            <input
              value={table.data.name}
              onChange={(event) =>
                renameTable(table.id, event.target.value)
              }
              aria-label="Table name"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>
                Columns · {table.data.columns.length}
              </SectionLabel>
              <IconButton
                icon={Plus}
                label="Add column"
                size="sm"
                onClick={() => addColumn(table.id)}
              />
            </div>

            {table.data.columns.length === 0 ? (
              <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-center text-xs text-ink-muted">
                This table has no columns yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {table.data.columns.map((column) => (
                  <li
                    key={column.id}
                    className="flex items-center gap-2 rounded-md border border-line bg-surface-subtle px-2 py-1.5"
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded",
                        column.isPrimaryKey
                          ? "bg-pk-soft text-pk"
                          : column.isForeignKey
                            ? "bg-fk-soft text-fk"
                            : "text-ink-subtle"
                      )}
                      aria-hidden="true"
                    >
                      {column.isPrimaryKey ? (
                        <KeyRound className="h-3 w-3" />
                      ) : column.isForeignKey ? (
                        <Link2 className="h-3 w-3" />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-line-strong" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">
                      {column.name || "Untitled column"}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-subtle">
                      {column.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <SectionLabel>Actions</SectionLabel>
            <Button
              variant="secondary"
              icon={Copy}
              onClick={() => duplicateTable(table.id)}
              className="w-full justify-start"
            >
              Duplicate table
            </Button>
            <Button
              variant="outlineDanger"
              icon={Trash2}
              onClick={() =>
                void confirmDeleteTable(table.id, table.data.name)
              }
              className="w-full justify-start"
            >
              Delete table
            </Button>
          </div>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Properties"
      eyebrow="Nothing selected"
      icon={<Settings2 className="h-4 w-4" />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="rounded-md border border-line bg-surface-subtle p-3 text-xs leading-relaxed text-ink-muted">
          Select a table or relationship on the canvas to edit its properties.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
              Tables
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {nodes.length}
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
              Relationships
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">{edgeCount}</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={addTable}
          className="w-full"
        >
          Add table
        </Button>
      </div>
    </PanelShell>
  );
}
