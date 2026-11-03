"use client";

import {
  FileCode2,
  FileInput,
  ImageDown,
  LayoutTemplate,
  Bot,
  Plus,
  Redo2,
  Share2,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PanelState, PanelTarget } from "./types";

type Props = {
  open: boolean;
  panel: PanelState;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddTable: () => void;
  onTogglePanel: (target: PanelTarget) => void;
  onExportPng: () => void;
  onClear: () => void;
  onClose: () => void;
};

function MobileAction({
  label,
  icon: Icon,
  onClick,
  active,
  danger,
  disabled,
  badge,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={active}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 px-4 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-40",
        danger
          ? "text-danger hover:bg-danger-soft"
          : active
            ? "bg-primary-soft text-primary"
            : "text-ink-muted hover:bg-surface-subtle hover:text-ink"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[9px] font-medium text-ink-subtle">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function MobileMenu({
  open,
  panel,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddTable,
  onTogglePanel,
  onExportPng,
  onClear,
  onClose,
}: Props) {
  if (!open) return null;

  const run = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      id="mobile-actions"
      className="absolute inset-x-0 top-full z-50 border-b border-line bg-surface shadow-[0_18px_36px_-24px_rgba(15,23,42,0.4)] animate-soft-fade md:hidden"
    >
      <div className="divide-y divide-line">
        <div className="py-1">
          <MobileAction
            label="Add table"
            icon={Plus}
            onClick={() => run(onAddTable)}
          />
          <MobileAction
            label="Share diagram"
            icon={Share2}
            active={panel === "share"}
            onClick={() => run(() => onTogglePanel("share"))}
          />
          <MobileAction
            label="SQL output"
            icon={FileCode2}
            active={panel === "sql"}
            onClick={() => run(() => onTogglePanel("sql"))}
          />
        </div>

        <div className="py-1">
          <MobileAction
            label="Import SQL"
            icon={FileInput}
            active={panel === "import"}
            onClick={() => run(() => onTogglePanel("import"))}
          />
          <MobileAction
            label="Examples"
            icon={LayoutTemplate}
            active={panel === "examples"}
            onClick={() => run(() => onTogglePanel("examples"))}
          />
          <MobileAction
            label="Export PNG"
            icon={ImageDown}
            onClick={() => run(onExportPng)}
          />
          <MobileAction
            label="Generate diagram"
            icon={Bot}
            badge="Beta"
            active={panel === "ai"}
            onClick={() => run(() => onTogglePanel("ai"))}
          />
        </div>

        <div className="py-1">
          <MobileAction
            label="Undo"
            icon={Undo2}
            disabled={!canUndo}
            onClick={() => run(onUndo)}
          />
          <MobileAction
            label="Redo"
            icon={Redo2}
            disabled={!canRedo}
            onClick={() => run(onRedo)}
          />
        </div>

        <div className="py-1">
          <MobileAction
            label="Clear diagram"
            icon={Trash2}
            danger
            onClick={() => run(onClear)}
          />
        </div>
      </div>

      <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-subtle">
        Changes save automatically in this browser.
      </p>
    </div>
  );
}
