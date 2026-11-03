"use client";

import { useMemo } from "react";
import { ArrowUpRight, Table2 } from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import { buildExample, EXAMPLE_LIST } from "@/lib/exampleDiagrams";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

type Props = {
  onLoaded?: () => void;
};

const DESCRIPTIONS: Record<string, string> = {
  school: "Teachers, courses, students, and enrollments.",
  library: "Authors, books, members, and loans.",
  ecommerce: "Customers, orders, products, and order items.",
};

export default function ExamplesPanel({ onLoaded }: Props) {
  const loadDiagram = useErdStore((state) => state.loadDiagram);

  const examples = useMemo(
    () =>
      EXAMPLE_LIST.map((example) => {
        const built = buildExample(example.id);
        const tables = built?.nodes.length ?? 0;
        const columns =
          built?.nodes.reduce(
            (total, node) => total + node.data.columns.length,
            0
          ) ?? 0;

        return {
          ...example,
          description: DESCRIPTIONS[example.id] ?? "Example schema",
          tables,
          columns,
        };
      }),
    []
  );

  const handleLoad = async (exampleId: string, label: string) => {
    const hasDiagram = useErdStore.getState().nodes.length > 0;
    if (hasDiagram) {
      const confirmed = await confirmDialog({
        title: "Replace the current diagram?",
        description:
          "Loading an example replaces every table and relationship on the canvas. You can undo this action.",
        confirmLabel: "Load example",
        tone: "danger",
      });
      if (!confirmed) return;
    }

    const example = buildExample(exampleId);
    if (!example) return;

    loadDiagram(example.nodes, example.edges);
    onLoaded?.();
    toast({
      title: `${label} example loaded`,
      description: `${example.nodes.length} tables added to the canvas.`,
      tone: "success",
    });
  };

  return (
    <div className="p-4 md:p-5">
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">
        Start from a ready-made schema. Everything stays editable.
      </p>

      <div className="space-y-2">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => void handleLoad(example.id, example.label)}
            className="group flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface-subtle text-ink-subtle">
              <Table2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink">
                {example.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                {example.description}
              </span>
              <span className="mt-1.5 block text-[10px] text-ink-subtle">
                {example.tables} tables · {example.columns} columns
              </span>
            </span>
            <ArrowUpRight
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-subtle">
        Loading an example replaces this canvas. You can undo it afterwards.
      </p>
    </div>
  );
}
