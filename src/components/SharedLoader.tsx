"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Copy, ImageDown, Pencil } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CanvasControls from "@/components/erd/CanvasControls";
import CanvasStatus from "@/components/erd/CanvasStatus";
import { ErdModeProvider } from "@/components/erd/ErdMode";
import RelationEdge from "@/components/RelationEdge";
import TableNode from "@/components/TableNode";
import { exportDiagramAsPng } from "@/lib/exportPng";
import { generateSql } from "@/lib/generateSql";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { useErdStore } from "@/store/useErdStore";
import type { ErdEdge, TableFlowNode } from "@/types/erd";

type Props = {
  name: string;
  nodes: Node[];
  edges: Edge[];
};

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge };

export default function SharedLoader({ name, nodes, edges }: Props) {
  const router = useRouter();
  const [viewNodes, , onNodesChange] = useNodesState<TableFlowNode>(
    nodes as TableFlowNode[]
  );
  const [viewEdges, , onEdgesChange] = useEdgesState<ErdEdge>(
    edges as ErdEdge[]
  );

  const sql = useMemo(() => generateSql(viewNodes).sql, [viewNodes]);

  const flowEdges = useMemo<ErdEdge[]>(
    () =>
      viewEdges.map((edge) => ({
        ...edge,
        type: "relation",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
          width: 10,
          height: 10,
        },
      })),
    [viewEdges]
  );

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      toast({ title: "SQL copied", tone: "success" });
    } catch {
      toast({
        title: "Could not copy",
        description: "Select the SQL in the editor instead.",
        tone: "error",
      });
    }
  };

  const exportPng = async () => {
    try {
      await exportDiagramAsPng(viewNodes);
      toast({ title: "PNG exported", tone: "success" });
    } catch {
      toast({
        title: "Export failed",
        description: "The diagram could not be exported. Please try again.",
        tone: "error",
      });
    }
  };

  const openInEditor = async () => {
    await useErdStore.persist.rehydrate();
    const hasLocalWork = useErdStore.getState().nodes.length > 0;

    if (hasLocalWork) {
      const confirmed = await confirmDialog({
        title: "Open in the editor?",
        description:
          "This replaces the diagram currently saved in your browser. You can undo it in the editor.",
        confirmLabel: "Open in editor",
        tone: "danger",
      });
      if (!confirmed) return;
    }

    useErdStore.getState().loadDiagram(viewNodes, viewEdges);
    router.push("/");
  };

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
      <header className="relative z-20 shrink-0 border-b border-line bg-surface">
        <div className="flex h-14 items-center gap-2.5 px-3 sm:px-4">
          <BrandMark className="h-8 w-8 shrink-0 text-ink" />
          <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-ink sm:block">
            ERD Studio
          </span>
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
          <span className="min-w-0 truncate text-[13px] font-medium text-ink">
            {name}
          </span>
          <Badge tone="neutral" className="shrink-0">
            Read-only
          </Badge>

          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              icon={Copy}
              onClick={copySql}
              disabled={!sql}
            >
              <span className="hidden lg:inline">Copy SQL</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={ImageDown}
              onClick={exportPng}
            >
              <span className="hidden lg:inline">Export PNG</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={Pencil}
              onClick={openInEditor}
            >
              <span className="hidden sm:inline">Open in editor</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <ErdModeProvider readOnly>
          <ReactFlow
            nodes={viewNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.15 }}
            minZoom={0.15}
            maxZoom={1.75}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesReconnectable={false}
            deleteKeyCode={null}
            elementsSelectable
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#d7dce3"
            />

            <Panel position="bottom-left" className="!m-3">
              <CanvasControls />
            </Panel>
            <Panel position="bottom-center" className="!m-3">
              <CanvasStatus
                nodeCount={viewNodes.length}
                edgeCount={viewEdges.length}
              />
            </Panel>
            {viewNodes.length > 3 ? (
              <MiniMap
                pannable
                zoomable
                className="!m-3 hidden xl:block"
                style={{ width: 160, height: 104 }}
                nodeColor="#cbd5e1"
                nodeStrokeColor="#94a3b8"
                nodeBorderRadius={6}
                maskColor="rgba(15, 23, 42, 0.06)"
              />
            ) : null}
          </ReactFlow>
        </ErdModeProvider>
      </div>
    </div>
  );
}
