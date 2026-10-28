import { NextResponse } from "next/server";
import { createDiagram } from "@/lib/diagramRepo";
import { diagramSchema, MAX_BODY_CHARS } from "@/lib/diagramSchema";

export async function POST(request: Request) {
  const text = await request.text();

  if (text.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Diagram is too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = diagramSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid diagram data" }, { status: 400 });
  }

  const { name, nodes, edges } = result.data;
  if (nodes.length === 0) {
    return NextResponse.json(
      { error: "Add at least one table before sharing" },
      { status: 400 }
    );
  }

  try {
    const id = await createDiagram(name, { nodes, edges });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("createDiagram failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}