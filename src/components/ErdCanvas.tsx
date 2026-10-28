"use client";

import { useEffect, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import TableNode from "@/components/TableNode";
import SqlPanel from "@/components/SqlPanel";
import ImportPanel from "@/components/ImportPanel";
import { useErdStore } from "@/store/useErdStore";
import { exportDiagramAsPng } from "@/lib/exportPng";
import { generateSql } from "@/lib/generateSql";
import { RELATION_TYPES, type RelationType } from "@/types/erd";

const nodeTypes = { table: TableNode };

type BottomPanel = "none" | "sql" | "import";

export default function ErdCanvas() {
  const nodes = useErdStore((s) => s.nodes);
  const edges = useErdStore((s) => s.edges);
  const onNodesChange = useErdStore((s) => s.onNodesChange);
  const onEdgesChange = useErdStore((s) => s.onEdgesChange);
  const onConnect = useErdStore((s) => s.onConnect);
  const addTable = useErdStore((s) => s.addTable);
  const setRelationType = useErdStore((s) => s.setRelationType);
  const clearAll = useErdStore((s) => s.clearAll);

  const [panel, setPanel] = useState<BottomPanel>("none");
  // Changing this key remounts the canvas, so "fitView" runs again after an import
  const [canvasKey, setCanvasKey] = useState(0);

  // Load the saved diagram from localStorage after the page loads in the browser
  useEffect(() => {
    useErdStore.persist.rehydrate();
  }, []);

  const sqlResult = useMemo(() => generateSql(nodes), [nodes]);
  const selectedEdge = edges.find((edge) => edge.selected);

  const togglePanel = (target: BottomPanel) =>
    setPanel((current) => (current === target ? "none" : target));

  const handleClear = () => {
    if (window.confirm("Delete all tables and relationships?")) {
      clearAll();
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <ReactFlow
          key={canvasKey}
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

          <Panel position="top-left" className="flex flex-wrap gap-2">
            <button
              onClick={addTable}
              className="rounded-md bg-primary px-4 py-2 text-white shadow hover:bg-primary-hover"
            >
              + Add Table
            </button>
            <button
              onClick={() => togglePanel("import")}
              className="rounded-md border border-line bg-surface px-4 py-2 text-ink shadow hover:bg-primary-soft"
            >
              {panel === "import" ? "Hide Import" : "Import SQL"}
            </button>
            <button
              onClick={() => togglePanel("sql")}
              className="rounded-md border border-line bg-surface px-4 py-2 text-ink shadow hover:bg-primary-soft"
            >
              {panel === "sql" ? "Hide SQL" : "Show SQL"}
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
                  setRelationType(
                    selectedEdge.id,
                    e.target.value as RelationType
                  )
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
                Press Backspace to delete the line
              </p>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {panel === "sql" && (
        <SqlPanel
          sql={sqlResult.sql}
          warnings={sqlResult.warnings}
          onClose={() => setPanel("none")}
        />
      )}

      {panel === "import" && (
        <ImportPanel
          onClose={() => setPanel("none")}
          onImported={() => setCanvasKey((key) => key + 1)}
        />
      )}
    </div>
  );
}