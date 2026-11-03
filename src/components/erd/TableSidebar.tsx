"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  PanelLeftClose,
  Plus,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useErdStore } from "@/store/useErdStore";
import IconButton from "@/components/ui/IconButton";
import MenuButton, { type MenuItem } from "@/components/ui/Menu";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

type Props = {
  onFocusTable: (tableId: string) => void;
  onCollapse: () => void;
};

export default function TableSidebar({ onFocusTable, onCollapse }: Props) {
  const nodes = useErdStore((state) => state.nodes);
  const addTable = useErdStore((state) => state.addTable);
  const duplicateTable = useErdStore((state) => state.duplicateTable);
  const deleteTable = useErdStore((state) => state.deleteTable);
  const undo = useErdStore((state) => state.undo);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return nodes;
    return nodes.filter((node) =>
      node.data.name.toLowerCase().includes(term)
    );
  }, [nodes, query]);

  const handleDelete = async (tableId: string, name: string) => {
    const confirmed = await confirmDialog({
      title: "Delete table?",
      description: `“${name}” and its relationships will be removed from the diagram.`,
      confirmLabel: "Delete table",
      tone: "danger",
    });
    if (!confirmed) return;

    deleteTable(tableId);
    toast({
      title: "Table deleted",
      description: `“${name}” was removed.`,
      tone: "default",
      action: { label: "Undo", onClick: undo },
    });
  };

  const rowActions = (tableId: string, name: string): MenuItem[] => [
    {
      label: "Duplicate table",
      icon: Copy,
      onClick: () => duplicateTable(tableId),
    },
    {
      label: "Delete table",
      icon: Trash2,
      danger: true,
      onClick: () => void handleDelete(tableId, name),
    },
  ];

  return (
    <aside
      aria-label="Tables"
      className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex"
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-3">
        <h2 className="text-xs font-semibold text-ink">Tables</h2>
        <span className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle">
          {nodes.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconButton icon={Plus} label="Add table" size="sm" onClick={addTable} />
          <IconButton
            icon={PanelLeftClose}
            label="Hide tables panel"
            size="sm"
            onClick={onCollapse}
          />
        </div>
      </div>

      <div className="shrink-0 p-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tables"
            aria-label="Search tables"
            className="erd-field h-8 w-full rounded-md border border-line bg-surface-subtle pl-8 pr-7 text-xs text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-subtle hover:bg-surface hover:text-ink"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <Table2
              className="mx-auto h-5 w-5 text-ink-subtle"
              aria-hidden="true"
            />
            <p className="mt-2 text-xs text-ink-muted">
              {nodes.length === 0 ? "No tables yet." : "No matching tables."}
            </p>
            {nodes.length === 0 ? (
              <button
                type="button"
                onClick={addTable}
                className="mt-2 text-xs font-medium text-primary hover:text-primary-hover"
              >
                Add your first table
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((node) => {
              const selected = Boolean(node.selected);

              return (
                <li key={node.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-0.5 rounded-md pr-0.5 transition-colors",
                      selected
                        ? "bg-primary-soft"
                        : "hover:bg-surface-subtle"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onFocusTable(node.id)}
                      aria-current={selected ? "true" : undefined}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                        selected ? "text-primary" : "text-ink"
                      )}
                    >
                      <Table2
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          selected ? "text-primary" : "text-ink-subtle"
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                        {node.data.name || "Untitled table"}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[10px]",
                          selected ? "text-primary/70" : "text-ink-subtle"
                        )}
                      >
                        {node.data.columns.length}
                      </span>
                    </button>

                    <MenuButton
                      label={`Actions for ${node.data.name}`}
                      items={rowActions(node.id, node.data.name)}
                      size="sm"
                      buttonClassName="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-line px-3 py-2.5">
        <p className="text-[10px] leading-relaxed text-ink-subtle">
          PostgreSQL schema
        </p>
      </div>
    </aside>
  );
}
