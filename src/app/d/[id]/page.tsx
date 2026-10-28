import { notFound } from "next/navigation";
import { getDiagram } from "@/lib/diagramRepo";
import SharedLoader from "@/components/SharedLoader";
import type { Edge, Node } from "@xyflow/react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharedDiagramPage({ params }: PageProps) {
  const { id } = await params;
  const diagram = await getDiagram(id);

  if (!diagram) notFound();

  return (
    <SharedLoader
      nodes={diagram.data.nodes as unknown as Node[]}
      edges={diagram.data.edges as unknown as Edge[]}
    />
  );
}