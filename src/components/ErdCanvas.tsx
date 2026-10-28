"use client";

import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import TableNode from "@/components/TableNode";
import { useErdStore } from "@/store/useErdStore";

const nodeTypes = { table: TableNode };

export default function ErdCanvas() {
  const nodes = useErdStore((s) => s.nodes);
  const edges = useErdStore((s) => s.edges);
  const onNodesChange = useErdStore((s) => s.onNodesChange);
  const onEdgesChange = useErdStore((s) => s.onEdgesChange);
  const onConnect = useErdStore((s) => s.onConnect);
  const addTable = useErdStore((s) => s.addTable);

  return (
    <div className="relative h-full w-full">
      <button
        onClick={addTable}
        className="absolute left-4 top-4 z-10 rounded-md bg-primary px-4 py-2 text-white shadow hover:bg-primary-hover"
      >
        + Add Table
      </button>

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
      </ReactFlow>
    </div>
  );
}