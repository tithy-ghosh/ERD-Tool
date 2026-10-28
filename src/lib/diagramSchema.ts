import { z } from "zod"

import { COLUMN_TYPES, RELATION_TYPES } from "@/types/erd"

export const MAX_BODY_CHARS = 200000;
export const MAX_TABLES = 100;
export const MAX_EDGES = 300;
export const MAX_COLUMNS_PER_TABLE = 100;

const columnSchema = z.object({
    id: z.string().min(1).max(100),
    name: z.string().max(100),
    type: z.enum(COLUMN_TYPES),
    isPrimaryKey: z.boolean(),
    isForeignKey: z.boolean(),
    references: z
       .object({
        tableId: z.string().max(100),
        columnId: z.string().max(100),
       })
       .nullable()
       .optional(),
});

const nodeSchema = z.object({
    id: z.string().min(1).max(100),
    type: z.literal("table").optional(),
    position: z.object({
        x: z.number().finite(),
        y: z.number().finite(),
    }),
    data: z.object({
        name: z.string().max(100),
        columns: z.array(columnSchema).max(MAX_COLUMNS_PER_TABLE),
    }),
});

const edgeSchema = z.object({
  id: z.string().min(1).max(200),
  source: z.string().max(100),
  target: z.string().max(100),
  sourceHandle: z.string().max(100).nullable().optional(),
  targetHandle: z.string().max(100).nullable().optional(),
  type: z.string().max(50).optional(),
  data: z
    .object({
      relationType: z.enum(RELATION_TYPES),
    })
    .optional(),
});

export const storedDataSchema = z.object({
  nodes: z.array(nodeSchema).max(MAX_TABLES),
  edges: z.array(edgeSchema).max(MAX_EDGES),
});

export const diagramSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nodes: z.array(nodeSchema).max(MAX_TABLES),
  edges: z.array(edgeSchema).max(MAX_EDGES),
});

export type DiagramInput = z.infer<typeof diagramSchema>;
export type StoredData = z.infer<typeof storedDataSchema>;