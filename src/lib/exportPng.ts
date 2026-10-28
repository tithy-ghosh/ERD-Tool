import { getNodesBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { TableFlowNode } from "@/types/erd";
export async function exportDiagramAsPng(nodes: TableFlowNode[]) {
  if (nodes.length === 0) return;
  const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewport) return;
  const padding = 50;
  const bounds = getNodesBounds(nodes);
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;
  const dataUrl = await toPng(viewport, {
    backgroundColor: "#f8fafc",
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${-bounds.x + padding}px, ${
        -bounds.y + padding
      }px) scale(1)`,
    },
  });
  const link = document.createElement("a");
  link.download = "erd-diagram.png";
  link.href = dataUrl;
  link.click();
}
