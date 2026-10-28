import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import type { Column, ErdEdge, RelationType, TableFlowNode } from "@/types/erd";


type ColumnPatch = Partial<Omit<Column, "id">>;

type ErdState = {
  nodes: TableFlowNode[];
  edges: ErdEdge[];

  onNodesChange: (changes: NodeChange<TableFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ErdEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addTable: () => void;
  deleteTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;

  addColumn: (tableId: string) => void;
  updateColumn: (tableId: string, columnId: string, patch: ColumnPatch) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  setRelationType: (edgeId: string, relationType: RelationType) => void;
  clearAll: () => void;
};

function mapTable(
  nodes: TableFlowNode[],
  tableId: string,
  update: (data: TableFlowNode["data"]) => TableFlowNode["data"]
): TableFlowNode[] {
  return nodes.map((node) =>
    node.id === tableId ? { ...node, data: update(node.data) } : node
  );
}

export const useErdStore = create<ErdState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],

      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges<TableFlowNode>(changes, get().nodes) }),

      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges<ErdEdge>(changes, get().edges) }),

      onConnect: (connection) => {
        const newEdge: ErdEdge = {
          id: crypto.randomUUID(),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          label: "one-to-many",
          data: { relationType: "one-to-many" },
        };
        set({ edges: [...get().edges, newEdge] });
      },

      addTable: () => {
        const count = get().nodes.length;
        const newNode: TableFlowNode = {
          id: crypto.randomUUID(),
          type: "table",
          position: { x: 50 + count * 40, y: 80 + count * 40 },
          data: {
            name: `table_${count + 1}`,
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
        set({ nodes: [...get().nodes, newNode] });
      },

      deleteTable: (tableId) =>
        set({
          nodes: get().nodes.filter((node) => node.id !== tableId),
          edges: get().edges.filter(
            (edge) => edge.source !== tableId && edge.target !== tableId
          ),
        }),

      renameTable: (tableId, name) =>
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({ ...data, name })),
        }),

      addColumn: (tableId) =>
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({
            ...data,
            columns: [
              ...data.columns,
              {
                id: crypto.randomUUID(),
                name: `column_${data.columns.length + 1}`,
                type: "TEXT",
                isPrimaryKey: false,
                isForeignKey: false,
              },
            ],
          })),
        }),

      updateColumn: (tableId, columnId, patch) =>
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({
            ...data,
            columns: data.columns.map((col) =>
              col.id === columnId ? { ...col, ...patch } : col
            ),
          })),
        }),

      deleteColumn: (tableId, columnId) =>
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({
            ...data,
            columns: data.columns.filter((col) => col.id !== columnId),
          })),
        }),

      setRelationType: (edgeId, relationType) =>
        set({
          edges: get().edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, label: relationType, data: { relationType } }
              : edge
          ),
        }),

      clearAll: () => set({ nodes: [], edges: [] }),
    }),
    {
      name: "erd-tool-diagram",
      skipHydration: true,
      partialize: (state) => ({
        nodes: state.nodes.map((node) => ({ ...node, selected: false })),
        edges: state.edges.map((edge) => ({ ...edge, selected: false })),
      }),
    }
  )
);