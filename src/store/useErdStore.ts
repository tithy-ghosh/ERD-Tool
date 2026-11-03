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
type Snapshot = { nodes: TableFlowNode[]; edges: ErdEdge[] };

type ErdState = {
  nodes: TableFlowNode[];
  edges: ErdEdge[];
  past: Snapshot[];
  future: Snapshot[];

  onNodesChange: (changes: NodeChange<TableFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ErdEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addTable: () => void;
  duplicateTable: (tableId: string) => void;
  deleteTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;

  addColumn: (tableId: string) => void;
  updateColumn: (tableId: string, columnId: string, patch: ColumnPatch) => void;
  deleteColumn: (tableId: string, columnId: string) => void;

  setRelationType: (edgeId: string, relationType: RelationType) => void;
  deleteEdge: (edgeId: string) => void;
  clearAll: () => void;
  loadDiagram: (nodes: TableFlowNode[], edges: ErdEdge[]) => void;

  undo: () => void;
  redo: () => void;
};

type SetState = (
  partial: Partial<ErdState> | ((state: ErdState) => Partial<ErdState>)
) => void;
type GetState = () => ErdState;

// Coalesce rapid edits so undo feels natural instead of undoing one keystroke.
let lastHistoryKey = "";
let lastHistoryAt = 0;
let dragActive = false;

function record(
  set: SetState,
  get: GetState,
  key = "",
  coalesceMs = 0
) {
  const now = Date.now();
  if (
    key &&
    coalesceMs > 0 &&
    lastHistoryKey === key &&
    now - lastHistoryAt < coalesceMs
  ) {
    lastHistoryAt = now;
    return;
  }

  const { nodes, edges, past } = get();
  set({
    past: [...past.slice(-49), { nodes, edges }],
    future: [],
  });
  lastHistoryKey = key;
  lastHistoryAt = now;
}

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
      past: [],
      future: [],

      onNodesChange: (changes) => {
        const hasRemove = changes.some((change) => change.type === "remove");
        const hasDragStart = changes.some(
          (change) => change.type === "position" && change.dragging === true
        );
        const hasDragEnd = changes.some(
          (change) => change.type === "position" && change.dragging === false
        );

        if (hasRemove) {
          record(set, get);
        } else if (hasDragStart && !dragActive) {
          record(set, get);
          dragActive = true;
        }
        if (hasDragEnd) dragActive = false;

        set({ nodes: applyNodeChanges<TableFlowNode>(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        if (changes.some((change) => change.type === "remove")) {
          record(set, get);
        }
        set({ edges: applyEdgeChanges<ErdEdge>(changes, get().edges) });
      },

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

        record(set, get);

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
        record(set, get);
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

      duplicateTable: (tableId) => {
        const source = get().nodes.find((node) => node.id === tableId);
        if (!source) return;

        record(set, get);
        const newNode: TableFlowNode = {
          ...source,
          id: crypto.randomUUID(),
          selected: false,
          position: {
            x: source.position.x + 48,
            y: source.position.y + 48,
          },
          data: {
            ...source.data,
            name: `${source.data.name}_copy`,
            columns: source.data.columns.map((column) => ({
              ...column,
              id: crypto.randomUUID(),
            })),
          },
        };
        set({ nodes: [...get().nodes, newNode] });
      },

      deleteTable: (tableId) => {
        record(set, get);
        set({
          nodes: clearReferences(
            get().nodes.filter((node) => node.id !== tableId),
            (ref) => ref.tableId === tableId
          ),
          edges: get().edges.filter(
            (edge) => edge.source !== tableId && edge.target !== tableId
          ),
        });
      },

      renameTable: (tableId, name) => {
        record(set, get, `table:${tableId}`, 700);
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({ ...data, name })),
        });
      },

      addColumn: (tableId) => {
        record(set, get);
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
        });
      },

      updateColumn: (tableId, columnId, patch) => {
        record(set, get, `column:${columnId}`, 500);
        set({
          nodes: mapTable(get().nodes, tableId, (data) => ({
            ...data,
            columns: data.columns.map((col) =>
              col.id === columnId ? { ...col, ...patch } : col
            ),
          })),
        });
      },

      deleteColumn: (tableId, columnId) => {
        record(set, get);
        set({
          nodes: clearReferences(
            mapTable(get().nodes, tableId, (data) => ({
              ...data,
              columns: data.columns.filter((col) => col.id !== columnId),
            })),
            (ref) => ref.columnId === columnId
          ),
        });
      },

      setRelationType: (edgeId, relationType) => {
        record(set, get);
        set({
          edges: get().edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, label: relationType, data: { relationType } }
              : edge
          ),
        });
      },

      deleteEdge: (edgeId) => {
        record(set, get);
        set({ edges: get().edges.filter((edge) => edge.id !== edgeId) });
      },

      clearAll: () => {
        record(set, get);
        set({ nodes: [], edges: [] });
      },

      loadDiagram: (nodes, edges) => {
        record(set, get);
        set({ nodes, edges });
      },

      undo: () => {
        const { past, future, nodes, edges } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        set({
          nodes: previous.nodes,
          edges: previous.edges,
          past: past.slice(0, -1),
          future: [{ nodes, edges }, ...future].slice(0, 50),
        });
        lastHistoryKey = "";
      },

      redo: () => {
        const { past, future, nodes, edges } = get();
        if (future.length === 0) return;

        const next = future[0];
        set({
          nodes: next.nodes,
          edges: next.edges,
          past: [...past.slice(-49), { nodes, edges }],
          future: future.slice(1),
        });
        lastHistoryKey = "";
      },
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
