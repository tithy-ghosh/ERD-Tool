"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import TableNode, { type TableFlowNode } from "@/components/TableNode";

const nodeTypes = { table: TableNode };

export default function ErdCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const addTable = () => {
    setNodes((current) => {
      const number = current.length + 1;

      const newNode: TableFlowNode = {
        id: crypto.randomUUID(),
        type: "table",
        position: { x: 50 + current.length * 40, y: 80 + current.length * 40 },
        data: {
          name: `table_${number}`,
          columns: [
            {
              id: crypto.randomUUID(),
              name: "id",
              type: "INT",
              isPrimaryKey: true,
              isForeignKey: false,
            },
            {
              id: crypto.randomUUID(),
              name: "name",
              type: "TEXT",
              isPrimaryKey: false,
              isForeignKey: false,
            },
          ],
        },
      };

      return [...current, newNode];
    });
  };

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges]
  );

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