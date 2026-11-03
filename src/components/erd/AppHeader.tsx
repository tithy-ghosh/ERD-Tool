"use client";

import {
  Check,
  FileCode2,
  FileInput,
  ImageDown,
  LayoutTemplate,
  Loader2,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Plus,
  Redo2,
  Share2,
  Trash2,
  Undo2,
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
  sidebarOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onToggleSidebar: () => void;
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
  sidebarOpen,
  onToggleMenu,
  onCloseMenu,
  onToggleSidebar,
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
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/erd2.png"
            alt="ERD Studio"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            priority
          />
          <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-ink sm:block">
            ERD Studio
          </span>
        </div>

        <span className="mx-1 hidden h-5 w-px shrink-0 bg-line sm:block" />

        <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
          <span className="truncate text-[13px] font-medium text-ink">
            Untitled schema
          </span>
          <SaveStatus state={saveState} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            icon={Undo2}
            label="Undo"
            onClick={undo}
            disabled={!canUndo}
            className="max-md:hidden"
          />
          <IconButton
            icon={Redo2}
            label="Redo"
            onClick={redo}
            disabled={!canRedo}
            className="max-md:hidden"
          />

          <IconButton
            icon={sidebarOpen ? PanelLeftClose : PanelLeftOpen}
            label={sidebarOpen ? "Hide tables panel" : "Show tables panel"}
            onClick={onToggleSidebar}
            className="max-lg:hidden"
          />

          <span className="mx-1 hidden h-5 w-px bg-line xl:block" />

          <Button
            icon={Plus}
            variant="primary"
            size="sm"
            onClick={onAddTable}
            className="max-sm:hidden "
          >
            Add table
          </Button>
          <IconButton
            icon={Plus}
            label="Add table"
            onClick={onAddTable}
            className="sm:hidden"
          />

          <Button
            icon={Bot}
            variant="ghost"
            size="sm"
            onClick={() => onTogglePanel("ai")}
            className={cn(
              panel === "ai" && "bg-primary-soft text-primary hover:bg-primary-soft"
            )}
            title="Generate from description"
          >
            <span className="hidden xl:inline">Generate</span>
          </Button>

          <Button
            icon={FileCode2}
            variant="ghost"
            size="sm"
            onClick={() => onTogglePanel("sql")}
            className={cn(
              panel === "sql" && "bg-primary-soft text-primary hover:bg-primary-soft"
            )}
          >
            <span className="hidden lg:inline">SQL</span>
          </Button>

          <Button
            icon={Share2}
            variant="secondary"
            size="sm"
            onClick={() => onTogglePanel("share")}
            className={cn(
              "max-sm:hidden",
              panel === "share" && "border-primary/30 bg-primary-soft text-primary"
            )}
          >
            <span className="hidden lg:inline">Share</span>
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
