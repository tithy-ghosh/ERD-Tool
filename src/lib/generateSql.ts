import type { ColumnType, TableFlowNode } from "@/types/erd";

export type SqlResult = {
  sql: string;
  warnings: string[];
};

const SQL_TYPES: Record<ColumnType, string> = {
  INT: "INTEGER",
  BIGINT: "BIGINT",
  TEXT: "TEXT",
  VARCHAR: "VARCHAR(255)",
  BOOLEAN: "BOOLEAN",
  DATE: "DATE",
  TIMESTAMP: "TIMESTAMP",
};

//Reserved words of PSQL
const RESERVED = new Set([
  "user",
  "order",
  "group",
  "table",
  "select",
  "column",
  "check",
  "default",
  "primary",
  "references",
  "desc",
  "limit",
  "offset",
  "end",
  "from",
  "where",
  "grant",
  "union",
  "unique",
  "all",
  "and",
  "or",
  "not",
  "null",
  "true",
  "false",
]);

function quoteIdent(name: string): string {
  const clean = name.trim() || "unnamed";
  if (/^[a-z_][a-z0-9_]*$/.test(clean) && !RESERVED.has(clean)) {
    return clean;
  }
  return `"${clean.replace(/"/g, '""')}"`;
}

function constraintName(table: string, column: string): string {
  const raw = `fk_${table}_${column}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 63);
  return quoteIdent(raw);
}

export function generateSql(nodes: TableFlowNode[]): SqlResult {
  const warnings: string[] = [];
  const createStatements: string[] = [];
  const fkStatements: string[] = [];
  const tableById = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    const { name, columns } = node.data;
    const tableSql = quoteIdent(name);

    if (columns.length === 0) {
      warnings.push(`Table "${name}" has no columns, so it was skipped`);
      continue;
    }

    // Check for duplicate column names
    const seen = new Set<string>();
    for (const col of columns) {
      const key = col.name.trim().toLowerCase();
      if (seen.has(key)) {
        warnings.push(`Table "${name}" has more than one column named "${col.name}"`);
      }
      seen.add(key);
    }

    const lines = columns.map(
      (col) => `  ${quoteIdent(col.name)} ${SQL_TYPES[col.type]}`
    );

    const primaryKeys = columns.filter((col) => col.isPrimaryKey);
    if (primaryKeys.length === 0) {
      warnings.push(`Table "${name}" has no Primary Key`);
    } else {
      const keyList = primaryKeys.map((col) => quoteIdent(col.name)).join(", ");
      lines.push(`  PRIMARY KEY (${keyList})`);
    }

    createStatements.push(`CREATE TABLE ${tableSql} (\n${lines.join(",\n")}\n);`);

    // Foreign Key
    for (const col of columns) {
      if (!col.isForeignKey) continue;

      const label = `${name}.${col.name}`;
      const refTable = col.references
        ? tableById.get(col.references.tableId)
        : undefined;
      const refCol = refTable?.data.columns.find(
        (c) => c.id === col.references?.columnId
      );

      if (!refTable || !refCol) {
        warnings.push(`${label} is a Foreign Key, but no referenced column is selected`);
        continue;
      }

      if (!refCol.isPrimaryKey) {
        warnings.push(
          `${label} references ${refTable.data.name}.${refCol.name}, which is no longer a Primary Key`
        );
        continue;
      }

      const refPkCount = refTable.data.columns.filter(
        (c) => c.isPrimaryKey
      ).length;
      if (refPkCount > 1) {
        warnings.push(
            `${label}: ${refTable.data.name} has a composite Primary Key, which a single column cannot reference`
        );
        continue;
      }

      if (refCol.type !== col.type) {
        warnings.push(
            `${label} type (${col.type}) does not match ${refTable.data.name}.${refCol.name} type (${refCol.type})`
        );
      }

      fkStatements.push(
        `ALTER TABLE ${tableSql}\n` +
          `  ADD CONSTRAINT ${constraintName(name, col.name)}\n` +
          `  FOREIGN KEY (${quoteIdent(col.name)})\n` +
          `  REFERENCES ${quoteIdent(refTable.data.name)} (${quoteIdent(refCol.name)});`
      );
    }
  }

  return {
    sql: [...createStatements, ...fkStatements].join("\n\n"),
    warnings,
  };
}