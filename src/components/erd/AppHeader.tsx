"use client";

import {
  Check,
  FileInput,
  ImageDown,
  LayoutTemplate,
  Loader2,
  Menu,
  PanelRight,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import MenuButton, { type MenuItem } from "@/components/ui/Menu";
import { cn } from "@/lib/cn";
import { useErdStore } from "@/store/useErdStore";
import { useSaveStatus } from "@/lib/useSaveStatus";
import MobileMenu from "./MobileMenu";
import type { PanelState, PanelTarget } from "./types";

type Props = {
  panel: PanelState;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAddTable: () => void;
  onTogglePanel: (target: PanelTarget) => void;
  onExportPng: () => void;
  onClear: () => void;
};

function SaveStatus({ state }: { state: "saved" | "saving" }) {
  const saving = state === "saving";

  return (
    <span
      className="hidden items-center gap-1.5 text-[11px] text-ink-subtle md:inline-flex"
      aria-live="polite"
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="h-3 w-3 text-success" aria-hidden="true" />
      )}
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}

export default function AppHeader({
  panel,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onAddTable,
  onTogglePanel,
  onExportPng,
  onClear,
}: Props) {
  const saveState = useSaveStatus();
  const undo = useErdStore((state) => state.undo);
  const redo = useErdStore((state) => state.redo);
  const canUndo = useErdStore((state) => state.past.length > 0);
  const canRedo = useErdStore((state) => state.future.length > 0);

  const moreItems: MenuItem[] = [
    {
      label: "Import SQL",
      icon: FileInput,
      onClick: () => onTogglePanel("import"),
    },
    {
      label: "Export PNG",
      icon: ImageDown,
      onClick: onExportPng,
    },
    {
      label: "Examples",
      icon: LayoutTemplate,
      onClick: () => onTogglePanel("examples"),
    },
    { separator: true },
    {
      label: "Clear diagram",
      icon: Trash2,
      danger: true,
      onClick: onClear,
    },
  ];

  return (
    <header className="relative z-50 shrink-0 border-b border-line bg-surface">
      <div className="flex h-12 items-center gap-2 px-2.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/erd2.png"
            alt="ERD Studio"
            width={24}
            height={24}
            className="h-6 w-6 shrink-0"
            priority
          />
          <span className="hidden text-[13px] font-semibold tracking-[-0.01em] text-ink lg:block">
            ERD Studio
          </span>
        </div>

        <span className="mx-0.5 hidden h-4 w-px shrink-0 bg-line lg:block" />

        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-[13px] font-medium text-ink">
            Untitled schema
          </span>
          <SaveStatus state={saveState} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            icon={PanelRight}
            label={
              panel === "properties"
                ? "Close properties panel"
                : "Open properties panel"
            }
            onClick={() => onTogglePanel("properties")}
            className={cn(
              panel === "properties" &&
                "bg-accent-soft text-accent-strong hover:bg-accent-soft-strong hover:text-accent-strong"
            )}
          />

          <Button
            icon={Share2}
            variant="primary"
            size="sm"
            onClick={() => onTogglePanel("share")}
          >
            <span className="hidden sm:inline">Share</span>
          </Button>

          <MenuButton label="More actions" items={moreItems} />

          <IconButton
            icon={menuOpen ? X : Menu}
            label={menuOpen ? "Close menu" : "Open menu"}
            onClick={onToggleMenu}
            size="lg"
            className="ml-0.5 md:hidden"
          />
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        panel={panel}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onAddTable={onAddTable}
        onTogglePanel={onTogglePanel}
        onExportPng={onExportPng}
        onClear={onClear}
        onClose={onCloseMenu}
      />
    </header>
  );
}
