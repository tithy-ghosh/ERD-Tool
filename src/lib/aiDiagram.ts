import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  diagramSchema,
  MAX_TABLES,
  MAX_EDGES,
  MAX_COLUMNS_PER_TABLE,
  type DiagramInput,
} from "@/lib/diagramSchema";

// If your TableNode uses Handles with an id, put the ids here.
// Leave undefined if each side has only one Handle without an id.
const SOURCE_HANDLE: string | undefined = undefined;
const TARGET_HANDLE: string | undefined = undefined;

const AI_COLUMN_TYPES = [
  "INT",
  "BIGINT",
  "TEXT",
  "VARCHAR",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
] as const;

const AI_RELATION_TYPES = ["one-to-one", "one-to-many", "many-to-many"] as const;

// What we expect from the AI (simple shape, no ids, no positions)
export const aiOutputSchema = z.object({
  tables: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        columns: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(60),
              type: z.enum(AI_COLUMN_TYPES),
              isPrimaryKey: z.boolean(),
            })
          )
          .min(1)
          .max(MAX_COLUMNS_PER_TABLE),
      })
    )
    .min(1)
    .max(MAX_TABLES),
  relationships: z
    .array(
      z.object({
        parent: z.string().trim().min(1),
        child: z.string().trim().min(1),
        type: z.enum(AI_RELATION_TYPES),
      })
    )
    .max(MAX_EDGES),
});

// JSON Schema sent to Gemini (written by hand, so no extra library is needed)
export const geminiJsonSchema = {
  type: "object",
  properties: {
    tables: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          columns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: [...AI_COLUMN_TYPES] },
                isPrimaryKey: { type: "boolean" },
              },
              required: ["name", "type", "isPrimaryKey"],
            },
          },
        },
        required: ["name", "columns"],
      },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          parent: { type: "string" },
          child: { type: "string" },
          type: { type: "string", enum: [...AI_RELATION_TYPES] },
        },
        required: ["parent", "child", "type"],
      },
    },
  },
  required: ["tables", "relationships"],
};

export const SYSTEM_PROMPT = `You are a database designer. Given a short description of a system, design a small, clean PostgreSQL schema.

Rules:
- Use 3 to 8 tables unless the user clearly needs more. Never more than 15 tables.
- Table and column names: lowercase snake_case. Table names are plural (for example "students").
- Every table has exactly one primary key column named "id" with type INT.
- Use only these column types: INT, BIGINT, TEXT, VARCHAR, BOOLEAN, DATE, TIMESTAMP.
- Do NOT add foreign key columns yourself. Describe links only in "relationships"; the app creates the foreign key columns.
- Do NOT use many-to-many. Create a junction table (with its own "id" primary key) and add two one-to-many relationships from each parent to the junction table.
- In "relationships", "parent" is the referenced table (the "one" side) and "child" is the table that holds the foreign key.
- Only use table names that exist in "tables".
- If the request is unclear, design the closest reasonable small schema.`;

type Col = {
  id: string;
  name: string;
  type: (typeof AI_COLUMN_TYPES)[number];
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references: { tableId: string; columnId: string } | null;
};

type Tbl = { id: string; name: string; columns: Col[] };

export type BuildResult =
  | { ok: true; data: DiagramInput }
  | { ok: false; error: string };

export function buildDiagram(raw: unknown, diagramName: string): BuildResult {
  const parsed = aiOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "AI answer had the wrong shape." };
  }

  // 1) Tables and columns
  const tables: Tbl[] = [];
  const byName = new Map<string, Tbl>();

  for (const t of parsed.data.tables) {
    const key = t.name.toLowerCase();
    if (byName.has(key)) {
      return { ok: false, error: `Duplicate table name: ${t.name}` };
    }
    const seen = new Set<string>();
    const columns: Col[] = [];
    for (const c of t.columns) {
      const ck = c.name.toLowerCase();
      if (seen.has(ck)) {
        return { ok: false, error: `Duplicate column "${c.name}" in "${t.name}"` };
      }
      seen.add(ck);
      columns.push({
        id: randomUUID(),
        name: c.name,
        type: c.type,
        isPrimaryKey: c.isPrimaryKey,
        isForeignKey: false,
        references: null,
      });
    }
    const tbl: Tbl = { id: randomUUID(), name: t.name, columns };
    tables.push(tbl);
    byName.set(key, tbl);
  }

  // 2) Edges and auto FK columns (same idea as onConnect in the store)
  const edges: Array<Record<string, unknown>> = [];
  const seenEdges = new Set<string>();

  for (const r of parsed.data.relationships) {
    const parent = byName.get(r.parent.toLowerCase());
    const child = byName.get(r.child.toLowerCase());
    if (!parent || !child || parent.id === child.id) continue;

    const edgeKey = `${parent.id}:${child.id}`;
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    const pks = parent.columns.filter((c) => c.isPrimaryKey);
    if (pks.length === 1) {
      const pk = pks[0];
      const fkName = `${parent.name}_${pk.name}`
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_");
      const exists = child.columns.some((c) => c.name.toLowerCase() === fkName);
      if (!exists) {
        child.columns.push({
          id: randomUUID(),
          name: fkName,
          type: pk.type,
          isPrimaryKey: false,
          isForeignKey: true,
          references: { tableId: parent.id, columnId: pk.id },
        });
      }
    }

    edges.push({
      id: randomUUID(),
      source: parent.id,
      target: child.id,
      ...(SOURCE_HANDLE ? { sourceHandle: SOURCE_HANDLE } : {}),
      ...(TARGET_HANDLE ? { targetHandle: TARGET_HANDLE } : {}),
      data: { relationType: r.type },
    });
  }

  // 3) Simple grid layout (3 tables per row)
  const PER_ROW = 3;
  const X_GAP = 340;
  const nodes: Array<Record<string, unknown>> = [];
  let y = 0;
  for (let start = 0; start < tables.length; start += PER_ROW) {
    const rowTables = tables.slice(start, start + PER_ROW);
    rowTables.forEach((t, i) => {
      nodes.push({
        id: t.id,
        type: "table",
        position: { x: i * X_GAP, y },
        data: { name: t.name, columns: t.columns },
      });
    });
    const maxCols = Math.max(...rowTables.map((t) => t.columns.length));
    y += 80 + maxCols * 34 + 60;
  }

  // 4) Final check with the same schema used by share links
  const result = diagramSchema.safeParse({
    name: diagramName,
    nodes,
    edges,
  });
  if (!result.success) {
    console.error("diagramSchema failed:", JSON.stringify(result.error.issues));
    return { ok: false, error: "Generated diagram did not pass validation." };
  }
  return { ok: true, data: result.data };
}