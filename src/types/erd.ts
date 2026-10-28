export type ColumnType =
  | "INT"
  | "BIGINT"
  | "TEXT"
  | "VARCHAR"
  | "BOOLEAN"
  | "DATE"
  | "TIMESTAMP";

export interface Column {
    id: string;
    name: string;
    type: ColumnType;
    isPrimaryKey: boolean;
    isFalseKey: boolean;
}

export interface Table{
    id: string;
    name: string;
    columns: Column[];
    position: { x: number; y: number };
}
export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface Relation{
    id: string;
    fromTable: string;
    toTable: string;
    type: RelationType
}