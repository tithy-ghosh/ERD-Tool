import type { Column, ErdEdge, RelationType, TableFlowNode } from "@/types/erd";

type ColumnType = Column["type"];
// [name, type, isPrimaryKey]
type ColDef = [string, ColumnType, boolean?];
type TableDef = { name: string; columns: ColDef[] };
type RelDef = { parent: string; child: string; type: RelationType };
type ExampleDef = {
  id: string;
  label: string;
  tables: TableDef[];
  relationships: RelDef[];
};

// Set these only if the Handles in TableNode.tsx have ids
const SOURCE_HANDLE: string | undefined = undefined;
const TARGET_HANDLE: string | undefined = undefined;

const COLUMNS_PER_ROW = 3;
const GAP_X = 340;
const GAP_Y = 320;

const EXAMPLES: ExampleDef[] = [
  {
    id: "school",
    label: "School",
    tables: [
      {
        name: "teachers",
        columns: [
          ["id", "INT", true],
          ["full_name", "VARCHAR"],
          ["email", "VARCHAR"],
        ],
      },
      {
        name: "courses",
        columns: [
          ["id", "INT", true],
          ["title", "VARCHAR"],
          ["credits", "INT"],
        ],
      },
      {
        name: "students",
        columns: [
          ["id", "INT", true],
          ["full_name", "VARCHAR"],
          ["birth_date", "DATE"],
        ],
      },
      {
        name: "enrollments",
        columns: [
          ["id", "INT", true],
          ["enrolled_at", "TIMESTAMP"],
          ["grade", "VARCHAR"],
        ],
      },
    ],
    relationships: [
      { parent: "teachers", child: "courses", type: "one-to-many" },
      { parent: "students", child: "enrollments", type: "one-to-many" },
      { parent: "courses", child: "enrollments", type: "one-to-many" },
    ],
  },
  {
    id: "library",
    label: "Library",
    tables: [
      {
        name: "authors",
        columns: [
          ["id", "INT", true],
          ["name", "VARCHAR"],
        ],
      },
      {
        name: "books",
        columns: [
          ["id", "INT", true],
          ["title", "VARCHAR"],
          ["isbn", "VARCHAR"],
          ["published_year", "INT"],
        ],
      },
      {
        name: "members",
        columns: [
          ["id", "INT", true],
          ["full_name", "VARCHAR"],
          ["joined_at", "DATE"],
        ],
      },
      {
        name: "loans",
        columns: [
          ["id", "INT", true],
          ["loaned_at", "TIMESTAMP"],
          ["due_date", "DATE"],
          ["returned", "BOOLEAN"],
        ],
      },
    ],
    relationships: [
      { parent: "authors", child: "books", type: "one-to-many" },
      { parent: "members", child: "loans", type: "one-to-many" },
      { parent: "books", child: "loans", type: "one-to-many" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    tables: [
      {
        name: "customers",
        columns: [
          ["id", "INT", true],
          ["full_name", "VARCHAR"],
          ["email", "VARCHAR"],
        ],
      },
      {
        name: "categories",
        columns: [
          ["id", "INT", true],
          ["name", "VARCHAR"],
        ],
      },
      {
        name: "products",
        columns: [
          ["id", "INT", true],
          ["name", "VARCHAR"],
          ["price", "INT"],
          ["in_stock", "BOOLEAN"],
        ],
      },
      {
        name: "orders",
        columns: [
          ["id", "INT", true],
          ["created_at", "TIMESTAMP"],
          ["status", "VARCHAR"],
        ],
      },
      {
        name: "order_items",
        columns: [
          ["id", "INT", true],
          ["quantity", "INT"],
        ],
      },
    ],
    relationships: [
      { parent: "categories", child: "products", type: "one-to-many" },
      { parent: "customers", child: "orders", type: "one-to-many" },
      { parent: "orders", child: "order_items", type: "one-to-many" },
      { parent: "products", child: "order_items", type: "one-to-many" },
    ],
  },
];

export const EXAMPLE_LIST = EXAMPLES.map(({ id, label }) => ({ id, label }));

export function buildExample(
  exampleId: string
): { nodes: TableFlowNode[]; edges: ErdEdge[] } | null {
  const def = EXAMPLES.find((e) => e.id === exampleId);
  if (!def) return null;

  const nodes: TableFlowNode[] = def.tables.map((table, index) => ({
    id: crypto.randomUUID(),
    type: "table",
    position: {
      x: (index % COLUMNS_PER_ROW) * GAP_X,
      y: Math.floor(index / COLUMNS_PER_ROW) * GAP_Y,
    },
    data: {
      name: table.name,
      columns: table.columns.map(([name, type, isPk]) => ({
        id: crypto.randomUUID(),
        name,
        type,
        isPrimaryKey: Boolean(isPk),
        isForeignKey: false,
        references: null,
      })),
    },
  }));

  const byName = new Map(nodes.map((node) => [node.data.name, node]));
  const edges: ErdEdge[] = [];

  for (const rel of def.relationships) {
    const parent = byName.get(rel.parent);
    const child = byName.get(rel.child);
    if (!parent || !child || parent.id === child.id) continue;

    const parentPks = parent.data.columns.filter((c) => c.isPrimaryKey);
    if (parentPks.length === 1) {
      const pk = parentPks[0];
      child.data.columns.push({
        id: crypto.randomUUID(),
        name: `${parent.data.name}_${pk.name}`.toLowerCase(),
        type: pk.type,
        isPrimaryKey: false,
        isForeignKey: true,
        references: { tableId: parent.id, columnId: pk.id },
      });
    }

    edges.push({
      id: crypto.randomUUID(),
      source: parent.id,
      target: child.id,
      sourceHandle: SOURCE_HANDLE,
      targetHandle: TARGET_HANDLE,
      data: { relationType: rel.type },
    });
  }

  return { nodes, edges };
}