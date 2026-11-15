"use client";

import {
  Maximize2,
  Minus,
  Plus,
  Redo2,
  Table2,
  Undo2,
  Waypoints,
} from "lucide-react";
import IconButton from "@/components/ui/IconButton";

type Props = {
  nodeCount: number;
  edgeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
};

export default function BottomBar({
  nodeCount,
  edgeCount,
  canUndo,
  canRedo,
  zoom,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
}: Props) {
  return (
    <footer className="@container flex h-8 shrink-0 items-center gap-1 border-t border-line bg-surface px-2 text-[11px] text-ink-muted">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Table2 className="h-3 w-3 text-ink-subtle" aria-hidden="true" />
          {nodeCount} {nodeCount === 1 ? "table" : "tables"}
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap @max-[420px]:hidden">
          <Waypoints className="h-3 w-3 text-ink-subtle" aria-hidden="true" />
          {edgeCount} {edgeCount === 1 ? "relationship" : "relationships"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <IconButton
          icon={Undo2}
          label="Undo"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="max-[400px]:hidden"
        />
        <IconButton
          icon={Redo2}
          label="Redo"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="max-[400px]:hidden"
        />
        <span className="mx-1 h-4 w-px bg-line max-sm:hidden" aria-hidden="true" />
        <IconButton
          icon={Minus}
          label="Zoom out"
          size="sm"
          onClick={onZoomOut}
        />
        <button
          type="button"
          onClick={onResetZoom}
          title="Reset zoom to 100%"
          className="h-7 min-w-11 rounded px-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton icon={Plus} label="Zoom in" size="sm" onClick={onZoomIn} />
        <IconButton
          icon={Maximize2}
          label="Fit view"
          size="sm"
          onClick={onFitView}
        />
      </div>
    </footer>
  );
}
