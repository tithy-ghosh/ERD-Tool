import type { Edge, Node } from "@xyflow/react";

export const COLUMN_TYPES = [
  "INT",
  "BIGINT",
  "TEXT",
  "VARCHAR",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
] as const;

export type ColumnType = (typeof COLUMN_TYPES)[number];

export const RELATION_TYPES = [
  "one-to-one",
  "one-to-many",
  "many-to-many",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  position: { x: number; y: number };
}

export interface Relation {
  id: string;
  fromTable: string;
  toTable: string;
  type: RelationType;
}
export type TableNodeData = {
  name: string;
  columns: Column[];
};

export type TableFlowNode = Node<TableNodeData, "table">;

export type ErdEdgeData = {
  relationType: RelationType;
};

export type ErdEdge = Edge<ErdEdgeData>;
