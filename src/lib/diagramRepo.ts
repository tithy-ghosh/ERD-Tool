import { getPrisma } from "@/lib/db";
import { storedDataSchema, type StoredData } from "@/lib/diagramSchema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createDiagram(
  name: string,
  data: StoredData
): Promise<string> {
  const prisma = getPrisma();
  const row = await prisma.diagram.create({
    data: {
      name,
      // JSON round trip makes the value fit Prisma's Json type
      data: JSON.parse(JSON.stringify(data)),
    },
    select: { id: true },
  });
  return row.id;
}

export async function getDiagram(
  id: string
): Promise<{ name: string; data: StoredData } | null> {
  if (!UUID_REGEX.test(id)) return null;

  const prisma = getPrisma();
  const row = await prisma.diagram.findUnique({ where: { id } });
  if (!row) return null;

  const parsed = storedDataSchema.safeParse(row.data);
  if (!parsed.success) return null;

  return { name: row.name, data: parsed.data };
}