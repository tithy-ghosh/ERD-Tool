"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import type { TableFlowNode } from "@/types/erd";
import TableColumnRow, { type RefOption } from "@/components/table/TableColumnRow";
import TableHeader from "@/components/table/TableHeader";
import { useErdMode } from "@/components/erd/ErdMode";

export default function TableNode({ id, data }: NodeProps<TableFlowNode>) {
  const nodes = useErdStore((state) => state.nodes);
  const addColumn = useErdStore((state) => state.addColumn);
  const { readOnly } = useErdMode();

  // Columns a Foreign Key can point to: the Primary Key columns of all tables
  const refOptions: RefOption[] = nodes.flatMap((node) =>
    node.data.columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => ({
        value: `${node.id}:${column.id}`,
        columnId: column.id,
        label: `${node.data.name}.${column.name}`,
      }))
  );

  return (
    <div className="table-card relative w-[320px] rounded-lg border border-line bg-surface text-sm text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-22px_rgba(15,23,42,0.35)]">
      {!readOnly ? (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </>
      ) : null}

      <TableHeader tableId={id} data={data} />

      <div>
        {data.columns.length === 0 ? (
          <p className="px-3 py-3 text-xs text-ink-subtle">No columns yet.</p>
        ) : (
          data.columns.map((column) => (
            <TableColumnRow
              key={column.id}
              tableId={id}
              column={column}
              refOptions={refOptions}
            />
          ))
        )}
      </div>

      {!readOnly ? (
        <button
          type="button"
          onClick={() => addColumn(id)}
          className="nodrag group flex h-9 w-full items-center gap-1.5 border-t border-line px-3 text-left text-xs font-medium text-ink-muted transition-colors hover:bg-surface-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add column
        </button>
      ) : null}
    </div>
  );
}
