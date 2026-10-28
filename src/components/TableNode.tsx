"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  COLUMN_TYPES,
  type ColumnType,
  type TableFlowNode,
} from "@/types/erd";
import { useErdStore } from "@/store/useErdStore";

export default function TableNode({ id, data }: NodeProps<TableFlowNode>) {
  const renameTable = useErdStore((s) => s.renameTable);
  const deleteTable = useErdStore((s) => s.deleteTable);
  const addColumn = useErdStore((s) => s.addColumn);
  const updateColumn = useErdStore((s) => s.updateColumn);
  const deleteColumn = useErdStore((s) => s.deleteColumn);

  return (
    <div className="min-w-[320px] rounded-md border-2 border-table-head bg-table-body text-sm text-ink shadow-md">
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

      {data.columns.map((col) => (
        <div
          key={col.id}
          className="flex items-center gap-1 border-t border-line px-2 py-1"
        >
          <button
            onClick={() =>
              updateColumn(id, col.id, { isPrimaryKey: !col.isPrimaryKey })
            }
            className={`nodrag rounded px-1 text-xs font-bold ${
              col.isPrimaryKey ? "bg-pk text-white" : "bg-line text-ink-muted"
            }`}
            title="Primary Key"
          >
            PK
          </button>

          <button
            onClick={() =>
              updateColumn(id, col.id, { isForeignKey: !col.isForeignKey })
            }
            className={`nodrag rounded px-1 text-xs font-bold ${
              col.isForeignKey ? "bg-fk text-white" : "bg-line text-ink-muted"
            }`}
            title="Foreign Key"
          >
            FK
          </button>

          <input
            value={col.name}
            onChange={(e) => updateColumn(id, col.id, { name: e.target.value })}
            className="nodrag w-full min-w-0 rounded border border-transparent px-1 outline-none focus:border-line"
          />

          <select
            value={col.type}
            onChange={(e) =>
              updateColumn(id, col.id, { type: e.target.value as ColumnType })
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
      ))}

      <button
        onClick={() => addColumn(id)}
        className="nodrag w-full rounded-b-sm border-t border-line px-2 py-1 text-left text-primary hover:bg-primary-soft"
      >
        + Add column
      </button>
    </div>
  );
}