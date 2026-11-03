"use client";

import { Copy, Table2, Trash2 } from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import type { TableNodeData } from "@/types/erd";
import { useErdMode } from "@/components/erd/ErdMode";
import MenuButton, { type MenuItem } from "@/components/ui/Menu";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

type Props = {
  tableId: string;
  data: TableNodeData;
};

export default function TableHeader({ tableId, data }: Props) {
  const renameTable = useErdStore((state) => state.renameTable);
  const deleteTable = useErdStore((state) => state.deleteTable);
  const duplicateTable = useErdStore((state) => state.duplicateTable);
  const undo = useErdStore((state) => state.undo);
  const { readOnly } = useErdMode();

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Delete table?",
      description: `“${data.name}” and its relationships will be removed from the diagram.`,
      confirmLabel: "Delete table",
      tone: "danger",
    });
    if (!confirmed) return;

    deleteTable(tableId);
    toast({
      title: "Table deleted",
      description: `“${data.name}” was removed.`,
      action: { label: "Undo", onClick: undo },
    });
  };

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
      onClick: () => void handleDelete(),
    },
  ];

  return (
    <div className="group/header flex items-center gap-2 border-b border-line bg-surface-subtle px-2.5 py-2">
      <Table2
        className="h-3.5 w-3.5 shrink-0 text-ink-subtle"
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
