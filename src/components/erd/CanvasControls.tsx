"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { useReactFlow, useViewport } from "@xyflow/react";
import IconButton from "@/components/ui/IconButton";

export default function CanvasControls() {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-line bg-surface p-1 shadow-[0_4px_12px_-8px_rgba(15,23,42,0.25)]">
      <IconButton
        icon={Minus}
        label="Zoom out"
        size="sm"
        onClick={() => zoomOut({ duration: 120 })}
      />
      <button
        type="button"
        onClick={() => zoomTo(1, { duration: 160 })}
        title="Reset zoom to 100%"
        className="h-7 min-w-12 rounded px-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {Math.round(zoom * 100)}%
      </button>
      <IconButton
        icon={Plus}
        label="Zoom in"
        size="sm"
        onClick={() => zoomIn({ duration: 120 })}
      />
      <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
      <IconButton
        icon={Maximize2}
        label="Fit view"
        size="sm"
        onClick={() =>
          fitView({ padding: 0.2, maxZoom: 1.2, duration: 220 })
        }
      />
    </div>
  );
}
