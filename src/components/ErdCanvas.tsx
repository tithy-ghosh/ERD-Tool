"use client";

import { useEffect } from "react";
import { ReactFlow, Background, Controls, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import TableNode from "@/components/TableNode";
import { useErdStore } from "@/store/useErdStore";
import { exportDiagramAsPng } from "@/lib/exportPng";
import { RELATION_TYPES, type RelationType } from "@/types/erd";

const nodeTypes = { table: TableNode };

export default function ErdCanvas() {
  const nodes = useErdStore((s) => s.nodes);
  const edges = useErdStore((s) => s.edges);
  const onNodesChange = useErdStore((s) => s.onNodesChange);
  const onEdgesChange = useErdStore((s) => s.onEdgesChange);
  const onConnect = useErdStore((s) => s.onConnect);
  const addTable = useErdStore((s) => s.addTable);
  const setRelationType = useErdStore((s) => s.setRelationType);
  const clearAll = useErdStore((s) => s.clearAll);

  useEffect(() => {
    useErdStore.persist.rehydrate();
  }, []);

  const selectedEdge = edges.find((edge) => edge.selected);

  const handleClear = () => {
    if (window.confirm("সব টেবিল আর লাইন মুছে ফেলবে?")) {
      clearAll();
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />

        <Panel position="top-left" className="flex gap-2">
          <button
            onClick={addTable}
            className="rounded-md bg-primary px-4 py-2 text-white shadow hover:bg-primary-hover"
          >
            + Add Table
          </button>
          <button
            onClick={() => exportDiagramAsPng(nodes)}
            className="rounded-md border border-line bg-surface px-4 py-2 text-ink shadow hover:bg-primary-soft"
          >
            Export PNG
          </button>
          <button
            onClick={handleClear}
            className="rounded-md border border-line bg-surface px-4 py-2 text-danger shadow hover:bg-primary-soft"
          >
            Clear
          </button>
        </Panel>

        {selectedEdge && (
          <Panel
            position="top-right"
            className="rounded-md border border-line bg-surface p-3 text-sm text-ink shadow"
          >
            <label className="mb-1 block font-semibold">Relationship</label>
            <select
              value={selectedEdge.data?.relationType ?? "one-to-many"}
              onChange={(e) =>
                setRelationType(selectedEdge.id, e.target.value as RelationType)
              }
              className="w-full rounded border border-line bg-white px-2 py-1"
            >
              {RELATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-ink-muted">
              লাইন মুছতে Backspace চাপো
            </p>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}