import type { Node } from "@xyflow/react";

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
export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface Relation {
  id: string;
  fromTable: string;
  toTable: string;
  type: RelationType;
}
export type TableNodeData ={
    name: string;
    columns: Column[];
}

export type TableFlowNode = Node<TableNodeData, "table">;