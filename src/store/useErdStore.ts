import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import type {
  Column,
  ErdEdge,
  RelationType,
  TableFlowNode,
} from "@/types/erd";

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

// Clears every Foreign Key reference that matches the given rule.
// Used when a table or a column is deleted.
function clearReferences(
  nodes: TableFlowNode[],
  shouldClear: (ref: { tableId: string; columnId: string }) => boolean
): TableFlowNode[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      columns: node.data.columns.map((col) =>
        col.references && shouldClear(col.references)
          ? { ...col, references: null }
          : col
      ),
    },
  }));
}

function makeFkName(
  parentName: string,
  pkName: string,
  existing: Column[]
): string {
  const base =
    `${parentName}_${pkName}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_") || "fk_column";

  const taken = new Set(existing.map((col) => col.name.toLowerCase()));
  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base}_${counter}`)) counter += 1;
  return `${base}_${counter}`;
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

      // The line goes from the parent table (right dot) to the child table (left dot).
      // The child table gets a Foreign Key column automatically.
      onConnect: (connection) => {
        const { source, target } = connection;
        if (!source || !target || source === target) return;

        const { nodes, edges } = get();
        const parent = nodes.find((node) => node.id === source);
        const child = nodes.find((node) => node.id === target);
        if (!parent || !child) return;

        const alreadyConnected = edges.some(
          (edge) => edge.source === source && edge.target === target
        );
        if (alreadyConnected) return;

        const newEdge: ErdEdge = {
          id: crypto.randomUUID(),
          source,
          target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          label: "one-to-many",
          data: { relationType: "one-to-many" },
        };

        const parentKeys = parent.data.columns.filter(
          (col) => col.isPrimaryKey
        );

        // Only one Primary Key: create the Foreign Key column automatically.
        // Otherwise, draw the line only and let the user add the FK by hand.
        if (parentKeys.length !== 1) {
          set({ edges: [...edges, newEdge] });
          return;
        }

        const pk = parentKeys[0];
        const fkColumn: Column = {
          id: crypto.randomUUID(),
          name: makeFkName(parent.data.name, pk.name, child.data.columns),
          type: pk.type,
          isPrimaryKey: false,
          isForeignKey: true,
          references: { tableId: parent.id, columnId: pk.id },
        };

        set({
          nodes: mapTable(nodes, child.id, (data) => ({
            ...data,
            columns: [...data.columns, fkColumn],
          })),
          edges: [...edges, newEdge],
        });
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
          nodes: clearReferences(
            get().nodes.filter((node) => node.id !== tableId),
            (ref) => ref.tableId === tableId
          ),
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
          nodes: clearReferences(
            mapTable(get().nodes, tableId, (data) => ({
              ...data,
              columns: data.columns.filter((col) => col.id !== columnId),
            })),
            (ref) => ref.columnId === columnId
          ),
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