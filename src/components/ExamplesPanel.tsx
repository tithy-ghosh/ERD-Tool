"use client";

import { useErdStore } from "@/store/useErdStore";
import { buildExample, EXAMPLE_LIST } from "@/lib/exampleDiagrams";

type Props = {
  onLoaded?: () => void;
};

export default function ExamplesPanel({ onLoaded }: Props) {
  const handleLoad = (exampleId: string) => {
    const hasDiagram = useErdStore.getState().nodes.length > 0;
    if (hasDiagram && !window.confirm("Replace the current diagram?")) {
      return;
    }
    const example = buildExample(exampleId);
    if (!example) return;
    useErdStore.setState({ nodes: example.nodes, edges: example.edges });
    onLoaded?.();
  };
  return (
    <div className="px-4 pb-4 pt-2">
      <p className="mb-3 text-sm text-ink-muted">
        Pick an example to load it on the canvas. You can edit it freely.
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_LIST.map((example) => (
          <button
            key={example.id}
            onClick={() => handleLoad(example.id)}
            className="rounded-md border border-line bg-white px-4 py-2 text-sm text-ink hover:bg-primary-soft"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
