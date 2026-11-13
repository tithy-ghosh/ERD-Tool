"use client";

import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { useErdStore } from "@/store/useErdStore";

export async function confirmDeleteTable(tableId: string, name: string) {
  const confirmed = await confirmDialog({
    title: "Delete table?",
    description: `“${name}” and its relationships will be removed from the diagram.`,
    confirmLabel: "Delete table",
    tone: "danger",
  });
  if (!confirmed) return;

  useErdStore.getState().deleteTable(tableId);
  toast({
    title: "Table deleted",
    description: `“${name}” was removed.`,
    action: { label: "Undo", onClick: () => useErdStore.getState().undo() },
  });
}
