"use client";

import { Share2, Bot, Table2 } from "lucide-react";
import AiPanel from "@/components/AiPanel";
import ExamplesPanel from "@/components/ExamplesPanel";
import ImportPanel from "@/components/ImportPanel";
import PanelShell from "@/components/PanelShell";
import SharePanel from "@/components/SharePanel";
import SqlPanel from "@/components/SqlPanel";
import type { PanelTarget } from "./types";

type Props = {
  panel: PanelTarget;
  sql: string;
  warnings: string[];
  onClose: () => void;
  onRefit: () => void;
};

export default function SidePanel({
  panel,
  sql,
  warnings,
  onClose,
  onRefit,
}: Props) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 animate-soft-fade lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="diagram-panel"
        aria-label="Diagram panel"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-xl border-t border-line bg-surface shadow-[0_-24px_60px_-30px_rgba(15,23,42,0.45)] animate-sheet-in lg:static lg:z-auto lg:h-full lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none lg:animate-panel-in"
      >
        <div className="flex shrink-0 justify-center py-2 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden />
        </div>

        <div className="flex h-full min-h-0 flex-col">
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
