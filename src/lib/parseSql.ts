import type {
  Column,
  ColumnType,
  ErdEdge,
  TableFlowNode,
} from "@/types/erd";

export type ParseResult = {
  nodes: TableFlowNode[];
  edges: ErdEdge[];
  warnings: string[];
};

type Obj = Record<string, unknown>;

type ParsedTable = {
  id: string;
  name: string;
  columns: Column[];
};

type RawFk = {
  table: string;
  column: string;
  refTable: string;
  refColumn: string;
};

type RawPk = {
  table: string;
  column: string;
};

type Context = {
  tables: ParsedTable[];
  fks: RawFk[];
  extraPks: RawPk[];
  warnings: string[];
};

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

// node-sql-parser returns names in different shapes depending on the version:
// a plain string, or an object such as { expr: { value: "id" } }.
function readName(value: unknown): string {
  if (typeof value === "string") return value;
  if (isObj(value)) {
    if ("column" in value) return readName(value.column);
    if ("table" in value) return readName(value.table);
    if ("expr" in value) return readName(value.expr);
    if ("value" in value) return readName(value.value);
  }
  return "";
}

function mapType(raw: string): ColumnType | null {
  const t = raw.toUpperCase();
  if (["INT", "INTEGER", "INT4", "SMALLINT", "INT2", "SERIAL"].includes(t)) {
    return "INT";
  }
  if (["BIGINT", "INT8", "BIGSERIAL"].includes(t)) return "BIGINT";
  if (t === "TEXT") return "TEXT";
  if (["VARCHAR", "CHARACTER VARYING", "CHAR", "CHARACTER"].includes(t)) {
    return "VARCHAR";
  }
  if (["BOOLEAN", "BOOL"].includes(t)) return "BOOLEAN";
  if (t === "DATE") return "DATE";
  if (t.startsWith("TIMESTAMP")) return "TIMESTAMP";
  return null;
}

function readReference(ref: Obj): { table: string; columns: string[] } {
  return {
    table: readName(toArray(ref.table)[0]),
    columns: toArray(ref.definition).map(readName),
  };
}

function handleCreate(stmt: Obj, ctx: Context) {
  const keyword = String(stmt.keyword ?? "").toLowerCase();
  if (keyword !== "table") {
    ctx.warnings.push(`Skipped CREATE ${keyword.toUpperCase() || "statement"}`);
    return;
  }

  const tableName = readName(toArray(stmt.table)[0]);
  if (!tableName) {
    ctx.warnings.push("Skipped a CREATE TABLE statement without a table name");
    return;
  }

  const columns: Column[] = [];
  const pkNames = new Set<string>();

  for (const def of toArray(stmt.create_definitions)) {
    if (!isObj(def)) continue;

    if (def.resource === "column") {
      const name = readName(def.column);
      const definition = isObj(def.definition) ? def.definition : {};
      const rawType =
        typeof definition.dataType === "string" ? definition.dataType : "";

      const mapped = mapType(rawType);
      if (!mapped) {
        ctx.warnings.push(
          `${tableName}.${name}: type "${rawType}" is not supported, using TEXT`
        );
      }
      const type: ColumnType = mapped ?? "TEXT";

      columns.push({
        id: crypto.randomUUID(),
        name,
        type,
        isPrimaryKey: Boolean(def.primary_key),
        isForeignKey: false,
        references: null,
      });

      // Inline foreign key: column_name INT REFERENCES other (id)
      if (isObj(def.reference_definition)) {
        const ref = readReference(def.reference_definition);
        ctx.fks.push({
          table: tableName,
          column: name,
          refTable: ref.table,
          refColumn: ref.columns[0] ?? "",
        });
      }
    } else if (def.resource === "constraint") {
      const kind = String(def.constraint_type ?? "").toLowerCase();
      const names = toArray(def.definition).map(readName).filter(Boolean);

      if (kind === "primary key") {
        names.forEach((n) => pkNames.add(n.toLowerCase()));
      } else if (kind === "foreign key" && isObj(def.reference_definition)) {
        const ref = readReference(def.reference_definition);
        names.forEach((columnName, index) => {
          ctx.fks.push({
            table: tableName,
            column: columnName,
            refTable: ref.table,
            refColumn: ref.columns[index] ?? "",
          });
        });
      }
    }
  }

  for (const column of columns) {
    if (pkNames.has(column.name.toLowerCase())) column.isPrimaryKey = true;
  }

  ctx.tables.push({ id: crypto.randomUUID(), name: tableName, columns });
}

function handleAlter(stmt: Obj, ctx: Context) {
  const tableName = readName(toArray(stmt.table)[0]);

  for (const item of toArray(stmt.expr)) {
    if (!isObj(item)) continue;

    for (const def of toArray(item.create_definitions)) {
      if (!isObj(def)) continue;

      const kind = String(def.constraint_type ?? "").toLowerCase();
      const names = toArray(def.definition).map(readName).filter(Boolean);

      if (kind === "primary key") {
        names.forEach((column) => ctx.extraPks.push({ table: tableName, column }));
      } else if (kind === "foreign key" && isObj(def.reference_definition)) {
        const ref = readReference(def.reference_definition);
        names.forEach((column, index) => {
          ctx.fks.push({
            table: tableName,
            column,
            refTable: ref.table,
            refColumn: ref.columns[index] ?? "",
          });
        });
      }
    }
  }
}

function estimateHeight(table: ParsedTable): number {
  const fkCount = table.columns.filter((c) => c.isForeignKey).length;
  return 40 + table.columns.length * 36 + fkCount * 28 + 36;
}

export async function parseSqlToDiagram(sql: string): Promise<ParseResult> {
  // Load the parser only when the user clicks Import, so the page stays light.
  const { Parser } = await import("node-sql-parser");
  const parser = new Parser();

  let parsed: unknown;
  try {
    parsed = parser.astify(sql, { database: "PostgresQL" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Could not read this SQL. ${message}`);
  }

  const ctx: Context = { tables: [], fks: [], extraPks: [], warnings: [] };

  for (const stmt of toArray(parsed)) {
    if (!isObj(stmt)) continue;
    const type = String(stmt.type ?? "").toLowerCase();

    if (type === "create") handleCreate(stmt, ctx);
    else if (type === "alter") handleAlter(stmt, ctx);
    else ctx.warnings.push(`Skipped unsupported statement: ${type || "unknown"}`);
  }

  const tableByName = new Map(
    ctx.tables.map((table) => [table.name.toLowerCase(), table])
  );

  // Primary keys added with ALTER TABLE
  for (const pk of ctx.extraPks) {
    const table = tableByName.get(pk.table.toLowerCase());
    const column = table?.columns.find(
      (c) => c.name.toLowerCase() === pk.column.toLowerCase()
    );
    if (column) column.isPrimaryKey = true;
  }

  // Resolve foreign keys and build the lines
  const edges: ErdEdge[] = [];
  const edgeKeys = new Set<string>();

  for (const fk of ctx.fks) {
    const child = tableByName.get(fk.table.toLowerCase());
    const parent = tableByName.get(fk.refTable.toLowerCase());
    const column = child?.columns.find(
      (c) => c.name.toLowerCase() === fk.column.toLowerCase()
    );

    if (!child || !parent || !column) {
      ctx.warnings.push(
        `Could not link ${fk.table}.${fk.column} to ${fk.refTable}, table or column not found`
      );
      continue;
    }

    let refColumn: Column | undefined;
    if (fk.refColumn) {
      refColumn = parent.columns.find(
        (c) => c.name.toLowerCase() === fk.refColumn.toLowerCase()
      );
    } else {
      const pks = parent.columns.filter((c) => c.isPrimaryKey);
      refColumn = pks.length === 1 ? pks[0] : undefined;
    }

    if (!refColumn) {
      ctx.warnings.push(
        `Could not find the referenced column for ${fk.table}.${fk.column}`
      );
      continue;
    }

    column.isForeignKey = true;
    column.references = { tableId: parent.id, columnId: refColumn.id };

    const key = `${parent.id}->${child.id}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push({
        id: crypto.randomUUID(),
        source: parent.id,
        target: child.id,
        label: "one-to-many",
        data: { relationType: "one-to-many" },
      });
    }
  }

  // Place the tables in a simple grid, 3 per row
  const perRow = 3;
  const colGap = 420;
  const rowGap = 60;
  const rowHeights: number[] = [];

  ctx.tables.forEach((table, index) => {
    const row = Math.floor(index / perRow);
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, estimateHeight(table));
  });

  const rowY: number[] = [];
  let y = 40;
  rowHeights.forEach((height, row) => {
    rowY[row] = y;
    y += height + rowGap;
  });

  const nodes: TableFlowNode[] = ctx.tables.map((table, index) => ({
    id: table.id,
    type: "table",
    position: {
      x: 40 + (index % perRow) * colGap,
      y: rowY[Math.floor(index / perRow)] ?? 40,
    },
    data: { name: table.name, columns: table.columns },
  }));

  return { nodes, edges, warnings: ctx.warnings };
}