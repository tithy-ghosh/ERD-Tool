"use client";

import { Copy, Plus, Settings2, Trash2 } from "lucide-react";
import { NodeToolbar, Position } from "@xyflow/react";
import IconButton from "@/components/ui/IconButton";
import { useErdStore } from "@/store/useErdStore";
import { confirmDeleteTable } from "./tableActions";
import { useEditorUi } from "./EditorUi";

type Props = {
  tableId: string;
  name: string;
  selected: boolean;
  readOnly: boolean;
};

export default function ShapeEditingBar({
  tableId,
  name,
  selected,
  readOnly,
}: Props) {
  const addColumn = useErdStore((state) => state.addColumn);
  const duplicateTable = useErdStore((state) => state.duplicateTable);
  const { openProperties } = useEditorUi();

  if (readOnly) return null;

  return (
    <NodeToolbar
      isVisible={selected}
      position={Position.Top}
      offset={10}
      className="nodrag nopan"
    >
      <div
        role="toolbar"
        aria-label={`Actions for ${name}`}
        className="flex items-center gap-0.5 rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_-14px_rgba(33,38,32,0.4)]"
      >
        <IconButton
          icon={Plus}
          label="Add column"
          size="sm"
          onClick={() => addColumn(tableId)}
        />
        <IconButton
          icon={Settings2}
          label="Open table properties"
          size="sm"
          onClick={() => openProperties(tableId)}
        />
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <IconButton
          icon={Copy}
          label="Duplicate table"
          size="sm"
          onClick={() => duplicateTable(tableId)}
        />
        <IconButton
          icon={Trash2}
          label="Delete table"
          size="sm"
          tone="danger"
          onClick={() => void confirmDeleteTable(tableId, name)}
        />
      </div>
    </NodeToolbar>
  );
}
