"use client";

import { useEffect } from "react";
import { useErdStore } from "@/store/useErdStore";

type Options = {
  onAddTable: () => void;
  onClosePanel: () => void;
};

export function useErdShortcuts({ onAddTable, onClosePanel }: Options) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditable) return;

      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          useErdStore.getState().redo();
        } else {
          useErdStore.getState().undo();
        }
        return;
      }

      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        useErdStore.getState().redo();
        return;
      }

      if (event.key === "Escape") {
        onClosePanel();
        return;
      }

      if (!modifier && !event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        onAddTable();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAddTable, onClosePanel]);
}
