"use client";

import {
  ArrowRight,
  FileInput,
  LayoutTemplate,
  Bot,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import EmptyStateArt from "./EmptyStateArt";

type Props = {
  onAddTable: () => void;
  onExamples: () => void;
  onImport: () => void;
  onAi: () => void;
};

export default function EmptyState({
  onAddTable,
  onExamples,
  onImport,
  onAi,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-y-auto overscroll-contain">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* Side panels can make the canvas much narrower than the viewport,
            so this card lays itself out against its own width. */}
        <div className="pointer-events-auto @container w-full max-w-[760px] animate-soft-fade overflow-hidden rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(40,44,51,0.04),0_24px_60px_-32px_rgba(40,44,51,0.28)]">
          <div className="p-6 @2xl:p-8">
            <div className="grid gap-6 @2xl:grid-cols-[minmax(0,1fr)_230px] @2xl:items-center @2xl:gap-8">
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">
                  PostgreSQL schema designer
                </p>
                <h1 className="mt-2 text-balance text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink @2xl:text-[28px]">
                  Design your database schema
                </h1>
                <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-ink-muted">
                  Add tables, connect relationships, and export production-ready
                  PostgreSQL. Changes save automatically in this browser.
                </p>
              </div>

              <div className="hidden @2xl:block">
                <EmptyStateArt />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 @lg:flex-row">
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={onAddTable}
                className="@lg:flex-1"
              >
                Add table
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={Bot}
                onClick={onAi}
                className="@lg:flex-1"
              >
                Generate from description
              </Button>
            </div>

            <div className="mt-2 flex flex-col gap-2 @md:flex-row">
              <Button
                variant="ghost"
                size="lg"
                icon={FileInput}
                onClick={onImport}
                className="@md:flex-1 justify-start @md:justify-center"
              >
                Import SQL
              </Button>
              <Button
                variant="ghost"
                size="lg"
                icon={LayoutTemplate}
                onClick={onExamples}
                className="@md:flex-1 justify-start @md:justify-center"
              >
                Browse examples
              </Button>
            </div>

            <ol className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-4 text-[11px] text-ink-subtle">
              <li>Add tables</li>
              <li aria-hidden="true">
                <ArrowRight className="h-3 w-3" />
              </li>
              <li>Connect keys</li>
              <li aria-hidden="true">
                <ArrowRight className="h-3 w-3" />
              </li>
              <li>Export SQL</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
