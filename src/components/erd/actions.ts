import {
  FileCode2,
  FileInput,
  Share2,
  Sparkles,
  Table2,
  type LucideIcon,
} from "lucide-react";
import type { PanelTarget } from "./types";

export type PanelAction = {
  key: PanelTarget;
  label: string;
  icon: LucideIcon;
};

export const PANEL_ACTIONS: PanelAction[] = [
  { key: "examples", label: "Examples", icon: Table2 },
  { key: "ai", label: "AI generate", icon: Sparkles },
  { key: "import", label: "Import SQL", icon: FileInput },
];

export const OUTPUT_ACTIONS: PanelAction[] = [
  { key: "sql", label: "SQL output", icon: FileCode2 },
  { key: "share", label: "Share", icon: Share2 },
];
