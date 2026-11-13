"use client";

import { Copy, Table2, Trash2 } from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import type { TableNodeData } from "@/types/erd";
import { useErdMode } from "@/components/erd/ErdMode";
import MenuButton, { type MenuItem } from "@/components/ui/Menu";
import { confirmDeleteTable } from "@/components/erd/tableActions";

type Props = {
  tableId: string;
  data: TableNodeData;
};

export default function TableHeader({ tableId, data }: Props) {
  const renameTable = useErdStore((state) => state.renameTable);
  const duplicateTable = useErdStore((state) => state.duplicateTable);
  const { readOnly } = useErdMode();

  const items: MenuItem[] = [
    {
      label: "Duplicate table",
      icon: Copy,
      onClick: () => duplicateTable(tableId),
    },
    {
      label: "Delete table",
      icon: Trash2,
      danger: true,
      onClick: () => void confirmDeleteTable(tableId, data.name),
    },
  ];

  return (
    <div className="group/header flex items-center gap-2 rounded-t-[5px] border-b border-line bg-surface-subtle px-2.5 py-2">
      <Table2
        className="h-3.5 w-3.5 shrink-0 text-primary"
        aria-hidden="true"
      />

      <input
        value={data.name}
        onChange={(event) => renameTable(tableId, event.target.value)}
        readOnly={readOnly}
        aria-label="Table name"
        title={readOnly ? data.name : "Rename table"}
        className="nodrag erd-field min-w-0 flex-1 rounded border-b border-transparent bg-transparent px-1 py-0.5 text-[13px] font-semibold tracking-[-0.01em] text-ink outline-none transition-colors read-only:cursor-default hover:border-line focus:border-primary focus-visible:ring-0"
      />

      <span className="shrink-0 whitespace-nowrap text-[10px] text-ink-subtle">
        {data.columns.length} {data.columns.length === 1 ? "col" : "cols"}
      </span>

      {!readOnly ? (
        <MenuButton
          label={`Actions for ${data.name}`}
          items={items}
          size="sm"
          buttonClassName="-mr-1 opacity-0 group-hover/header:opacity-100 group-focus-within/header:opacity-100 focus-visible:opacity-100"
        />
      ) : null}
    </div>
  );
}
