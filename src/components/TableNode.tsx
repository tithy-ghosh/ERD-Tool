"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  COLUMN_TYPES,
  type ColumnType,
  type TableFlowNode,
} from "@/types/erd";
import { useErdStore } from "@/store/useErdStore";

export default function TableNode({ id, data }: NodeProps<TableFlowNode>) {
  const nodes = useErdStore((s) => s.nodes);
  const renameTable = useErdStore((s) => s.renameTable);
  const deleteTable = useErdStore((s) => s.deleteTable);
  const addColumn = useErdStore((s) => s.addColumn);
  const updateColumn = useErdStore((s) => s.updateColumn);
  const deleteColumn = useErdStore((s) => s.deleteColumn);

  // Columns a Foreign Key can point to: the Primary Key columns of all tables
  const refOptions = nodes.flatMap((node) =>
    node.data.columns
      .filter((c) => c.isPrimaryKey)
      .map((c) => ({
        value: `${node.id}:${c.id}`,
        columnId: c.id,
        label: `${node.data.name}.${c.name}`,
      }))
  );

  return (
    <div className="min-w-[340px] rounded-md border-2 border-table-head bg-table-body text-sm text-ink shadow-md">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center gap-2 rounded-t-sm bg-table-head px-2 py-1">
        <input
          value={data.name}
          onChange={(e) => renameTable(id, e.target.value)}
          className="nodrag w-full bg-transparent font-semibold text-white outline-none"
        />
        <button
          onClick={() => deleteTable(id)}
          className="nodrag text-white/70 hover:text-danger"
          title="Delete table"
        >
          ✕
        </button>
      </div>

      {data.columns.map((col) => {
        const options = refOptions.filter((o) => o.columnId !== col.id);
        const current = col.references
          ? `${col.references.tableId}:${col.references.columnId}`
          : "";
        const selectValue = options.some((o) => o.value === current)
          ? current
          : "";

        return (
          <div key={col.id} className="border-t border-line px-2 py-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  updateColumn(id, col.id, { isPrimaryKey: !col.isPrimaryKey })
                }
                className={`nodrag rounded px-1 text-xs font-bold ${
                  col.isPrimaryKey
                    ? "bg-pk text-white"
                    : "bg-line text-ink-muted"
                }`}
                title="Primary Key"
              >
                PK
              </button>

              <button
                onClick={() =>
                  updateColumn(id, col.id, {
                    isForeignKey: !col.isForeignKey,
                    references: null,
                  })
                }
                className={`nodrag rounded px-1 text-xs font-bold ${
                  col.isForeignKey
                    ? "bg-fk text-white"
                    : "bg-line text-ink-muted"
                }`}
                title="Foreign Key"
              >
                FK
              </button>

              <input
                value={col.name}
                onChange={(e) =>
                  updateColumn(id, col.id, { name: e.target.value })
                }
                className="nodrag w-full min-w-0 rounded border border-transparent px-1 outline-none focus:border-line"
              />

              <select
                value={col.type}
                onChange={(e) =>
                  updateColumn(id, col.id, {
                    type: e.target.value as ColumnType,
                  })
                }
                className="nodrag rounded border border-line bg-white px-1 text-ink-muted"
              >
                {COLUMN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <button
                onClick={() => deleteColumn(id, col.id)}
                className="nodrag px-1 text-ink-muted hover:text-danger"
                title="Delete column"
              >
                ✕
              </button>
            </div>

            {col.isForeignKey && (
              <div className="mt-1 flex items-center gap-1 pl-1 text-xs">
                <span className="text-fk">references →</span>
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      updateColumn(id, col.id, { references: null });
                      return;
                    }
                    const [tableId, columnId] = value.split(":");
                    updateColumn(id, col.id, {
                      references: { tableId, columnId },
                    });
                  }}
                  className="nodrag w-full rounded border border-line bg-white px-1 py-0.5"
                >
                  <option value="">Select...</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={() => addColumn(id)}
        className="nodrag w-full rounded-b-sm border-t border-line px-2 py-1 text-left text-primary hover:bg-primary-soft"
      >
        + Add column
      </button>
    </div>
  );
}