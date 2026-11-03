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
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="pointer-events-auto my-auto w-full max-w-[calc(100vw-2rem)] animate-soft-fade overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_60px_-32px_rgba(15,23,42,0.35)] sm:max-w-[760px]">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_250px] md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">
              PostgreSQL schema designer
            </p>
            <h1 className="mt-2 text-balance text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[28px]">
              Design your database schema
            </h1>
            <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-ink-muted">
              Add tables, connect relationships, and export production-ready
              PostgreSQL. Changes save automatically in this browser.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={onAddTable}
                className="sm:flex-1"
              >
                Add table
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={Bot}
                onClick={onAi}
                className="sm:flex-1"
              >
                Generate from description
              </Button>
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="ghost"
                size="lg"
                icon={FileInput}
                onClick={onImport}
                className="sm:flex-1 justify-start sm:justify-center"
              >
                Import SQL
              </Button>
              <Button
                variant="ghost"
                size="lg"
                icon={LayoutTemplate}
                onClick={onExamples}
                className="sm:flex-1 justify-start sm:justify-center"
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

          <div className="hidden md:block">
            <EmptyStateArt />
          </div>
        </div>
      </div>
    </div>
  );
}
