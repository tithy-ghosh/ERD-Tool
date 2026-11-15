"use client";

import { Activity, Share2, Bot, Table2 } from "lucide-react";
import PlanPanel from "../plan/PlanPanel";
import AiPanel from "@/components/AiPanel";
import ExamplesPanel from "@/components/ExamplesPanel";
import ImportPanel from "@/components/ImportPanel";
import PanelShell from "@/components/PanelShell";
import SharePanel from "@/components/SharePanel";
import SqlPanel from "@/components/SqlPanel";
import type { ErdEdge, TableFlowNode } from "@/types/erd";
import PropertiesPanel from "./PropertiesPanel";
import type { PanelTarget } from "./types";

type Props = {
  panel: PanelTarget;
  sql: string;
  warnings: string[];
  table: TableFlowNode | null;
  edge: ErdEdge | null;
  onClose: () => void;
  onRefit: () => void;
  onPlanReady: () => void;
};

export default function SidePanel({
  panel,
  sql,
  warnings,
  table,
  edge,
  onClose,
  onRefit,
  onPlanReady,
}: Props) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/35 animate-soft-fade lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="diagram-panel"
        aria-label="Diagram panel"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-xl border-t border-line bg-surface shadow-[0_-24px_60px_-30px_rgba(33,38,32,0.3)] animate-sheet-in lg:static lg:z-auto lg:h-full lg:w-[320px] lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none lg:animate-panel-in"
      >
        <div className="flex shrink-0 justify-center py-2 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden />
        </div>

        <div className="flex h-full min-h-0 flex-col">
          {panel === "properties" ? (
            <PropertiesPanel table={table} edge={edge} onClose={onClose} />
          ) : null}

          {panel === "sql" ? (
            <SqlPanel sql={sql} warnings={warnings} onClose={onClose} />
          ) : null}

          {panel === "import" ? (
            <ImportPanel onClose={onClose} onImported={onRefit} />
          ) : null}

          {panel === "examples" ? (
            <PanelShell
              title="Examples"
              eyebrow="Start from a ready-made schema"
              icon={<Table2 className="h-4 w-4" />}
              onClose={onClose}
            >
              <ExamplesPanel onLoaded={onRefit} />
            </PanelShell>
          ) : null}

          {panel === "ai" ? (
            <PanelShell
              title="Generate from description"
              eyebrow="Describe your schema in a sentence"
              icon={<Bot className="h-4 w-4" />}
              onClose={onClose}
            >
              <AiPanel onGenerated={onRefit} />
            </PanelShell>
          ) : null}
          {panel === "plan" ? (
            <PanelShell
              title="Query plan"
              eyebrow="See where a query spends its time"
              icon={<Activity className="h-4 w-4" />}
              onClose={onClose}
            >
              <PlanPanel onRan={onPlanReady} />
            </PanelShell>
          ) : null}
          {panel === "share" ? (
            <PanelShell
              title="Share diagram"
              eyebrow="Create a read-only link"
              icon={<Share2 className="h-4 w-4" />}
              onClose={onClose}
            >
              <SharePanel />
            </PanelShell>
          ) : null}
        </div>
      </aside>
    </>
  );
}
