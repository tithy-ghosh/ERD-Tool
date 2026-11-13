"use client";

import {
  Bot,
  FileCode2,
  FileInput,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  type LucideIcon,
} from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import type { PanelState, PanelTarget } from "./types";

type Tool = {
  label: string;
  icon: LucideIcon;
  target?: PanelTarget;
  onClick?: () => void;
};

type Props = {
  panel: PanelState;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onAddTable: () => void;
  onTogglePanel: (target: PanelTarget) => void;
};

export default function ToolRail({
  panel,
  sidebarOpen,
  onToggleSidebar,
  onAddTable,
  onTogglePanel,
}: Props) {
  const tools: Tool[] = [
    { label: "Add table", icon: Plus, onClick: onAddTable },
    { label: "Generate from description", icon: Bot, target: "ai" },
    { label: "Import SQL", icon: FileInput, target: "import" },
    { label: "SQL output", icon: FileCode2, target: "sql" },
    { label: "Examples", icon: LayoutTemplate, target: "examples" },
  ];

  return (
    <nav
      aria-label="Document tools"
      className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-line bg-surface-subtle py-2 md:flex"
    >
      <IconButton
        icon={sidebarOpen ? PanelLeftClose : PanelLeftOpen}
        label={sidebarOpen ? "Hide document tools" : "Show document tools"}
        onClick={onToggleSidebar}
        className={cn(
          sidebarOpen && "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
        )}
      />

      <span className="my-1 h-px w-6 bg-line" aria-hidden="true" />

      {tools.map(({ label, icon, target, onClick }) => {
        const active = target ? panel === target : false;

        return (
          <IconButton
            key={label}
            icon={icon}
            label={label}
            onClick={target ? () => onTogglePanel(target) : onClick}
            className={cn(
              active &&
                "bg-accent-soft text-accent-strong hover:bg-accent-soft-strong hover:text-accent-strong"
            )}
          />
        );
      })}
    </nav>
  );
}
