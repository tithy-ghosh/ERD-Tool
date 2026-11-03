"use client";

import { Link2, Table2 } from "lucide-react";

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

type Props = {
  nodeCount: number;
  edgeCount: number;
};

export default function CanvasStatus({ nodeCount, edgeCount }: Props) {
  return (
    <div className="hidden items-center gap-2 whitespace-nowrap rounded-md border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] text-ink-muted shadow-[0_4px_12px_-8px_rgba(15,23,42,0.25)] sm:flex">
      <Table2 className="h-3 w-3 text-ink-subtle" aria-hidden="true" />
      {plural(nodeCount, "table", "tables")}
      <span className="h-3 w-px bg-line" aria-hidden="true" />
      <Link2 className="h-3 w-3 text-ink-subtle" aria-hidden="true" />
      {plural(edgeCount, "relationship", "relationships")}
    </div>
  );
}
