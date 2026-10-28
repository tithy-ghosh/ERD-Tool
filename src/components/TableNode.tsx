"use client";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Column } from "@/types/erd";


export type TableNodeData = {
  name: string;
  columns: Column[];
};
export type TableFlowNode = Node<TableNodeData, "table">;
export default function TableNode({ data }: NodeProps<TableFlowNode>) {
  return (
    <div className="min-w-[200px] rounded-md border-2border-table-head bg-table-body text-sm text-ink shadow-md">
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="rounded-t-sm bg-table-head px-3 py-1 font-semibold text-white">
        {data.name}
      </div>
      {
        data.columns.map((col) => (
            <div key={col.id}
            className="flex items-center justify-between gap-4 border-t border-line px-3 py-1"
            >
                <span  className="flex items-center gap-1">
                    { col.isPrimaryKey&& <span className="font-bold text-pk">PK</span> }
                    {col.isForeignKey && <span className="font-bold text-fk">FK</span>}
                    <span>{col.name}</span>
                </span>
                <span className="text-ink-muted">{col.type}</span>
            </div>
        ))
      }
    </div>
  );
}
