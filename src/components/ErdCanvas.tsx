"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RelationEdge from "@/components/RelationEdge";
import TableNode from "@/components/TableNode";
import AppHeader from "@/components/erd/AppHeader";
import CanvasControls from "@/components/erd/CanvasControls";
import CanvasStatus from "@/components/erd/CanvasStatus";
import EdgeInspector from "@/components/erd/EdgeInspector";
import EmptyState from "@/components/erd/EmptyState";
import SidePanel from "@/components/erd/SidePanel";
import TableSidebar from "@/components/erd/TableSidebar";
import type { PanelState, PanelTarget } from "@/components/erd/types";
import { exportDiagramAsPng } from "@/lib/exportPng";
import { generateSql } from "@/lib/generateSql";
import { useErdShortcuts } from "@/lib/useErdShortcuts";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { useErdStore } from "@/store/useErdStore";
import type { ErdEdge, RelationType, TableFlowNode } from "@/types/erd";

const nodeTypes = { table: TableNode };
const edgeTypes = { relation: RelationEdge };

type Props = {
  // SharedLoader already rehydrates the store, so it sets this to true
  skipRehydrate?: boolean;
};

export default function ErdCanvas({ skipRehydrate = false }: Props) {
  const nodes = useErdStore((state) => state.nodes);
  const edges = useErdStore((state) => state.edges);
  const onNodesChange = useErdStore((state) => state.onNodesChange);
  const onEdgesChange = useErdStore((state) => state.onEdgesChange);
  const onConnect = useErdStore((state) => state.onConnect);
  const addTable = useErdStore((state) => state.addTable);
  const setRelationType = useErdStore((state) => state.setRelationType);
  const deleteEdge = useErdStore((state) => state.deleteEdge);
  const clearAll = useErdStore((state) => state.clearAll);
  const undo = useErdStore((state) => state.undo);

  const [panel, setPanel] = useState<PanelState>("none");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Changing this key remounts the canvas, so "fitView" runs again after an import
  const [canvasKey, setCanvasKey] = useState(0);
  const flowRef = useRef<ReactFlowInstance<TableFlowNode, ErdEdge> | null>(null);

  useEffect(() => {
    if (skipRehydrate) return;
    useErdStore.persist.rehydrate();
  }, [skipRehydrate]);

  // The desktop panels take width from the canvas, so keep the diagram in view
  // when they open or close. Remounting after an import also refits the canvas.
  useEffect(() => {
    // Wait for newly mounted nodes to be measured before fitting.
    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      flowRef.current?.fitView({
        padding: 0.2,
        minZoom: 0.15,
        maxZoom: 1.15,
        duration: reduceMotion ? 0 : 220,
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [panel, sidebarOpen, canvasKey]);

  const sqlResult = useMemo(() => generateSql(nodes), [nodes]);
  const selectedEdge = edges.find((edge) => edge.selected);

  const flowEdges = useMemo<ErdEdge[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "relation",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
          width: 10,
          height: 10,
        },
      })),
    [edges]
  );

  const togglePanel = (target: PanelTarget) => {
    setPanel((current) => (current === target ? "none" : target));
    setMenuOpen(false);
  };

  const closePanel = () => setPanel("none");

  useErdShortcuts({ onAddTable: addTable, onClosePanel: closePanel });

  const handleClear = async () => {
    setMenuOpen(false);
    const confirmed = await confirmDialog({
      title: "Clear diagram?",
      description:
        "This removes every table and relationship. You can undo this action.",
      confirmLabel: "Clear diagram",
      tone: "danger",
    });
    if (!confirmed) return;

    clearAll();
    toast({
      title: "Diagram cleared",
      description: "All tables and relationships were removed.",
      action: { label: "Undo", onClick: undo },
    });
  };

  const handleExportPng = async () => {
    setMenuOpen(false);
    if (nodes.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Add at least one table first.",
      });
      return;
    }

    try {
      await exportDiagramAsPng(nodes);
      toast({ title: "PNG exported", tone: "success" });
    } catch {
      toast({
        title: "Export failed",
        description: "The diagram could not be exported. Please try again.",
        tone: "error",
      });
    }
  };

  const refitCanvas = () => setCanvasKey((key) => key + 1);

  const focusTable = (tableId: string) => {
    const current = useErdStore.getState().nodes;
    useErdStore.setState({
      nodes: current.map((node) => ({
        ...node,
        selected: node.id === tableId,
      })),
    });
    flowRef.current?.fitView({
      nodes: [{ id: tableId }],
      padding: 2,
      maxZoom: 1.2,
      duration: 260,
    });
  };

  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    deleteEdge(selectedEdge.id);
    toast({
      title: "Relationship deleted",
      action: { label: "Undo", onClick: undo },
    });
  };

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
      <AppHeader
        panel={panel}
        menuOpen={menuOpen}
        sidebarOpen={sidebarOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onAddTable={addTable}
        onTogglePanel={togglePanel}
        onExportPng={handleExportPng}
        onClear={handleClear}
      />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen ? (
          <TableSidebar
            onFocusTable={focusTable}
            onCollapse={() => setSidebarOpen(false)}
          />
        ) : null}

        <div className="relative min-h-0 min-w-0 flex-1">
          <ReactFlow
            key={canvasKey}
            nodes={nodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              flowRef.current = instance;
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.15 }}
            minZoom={0.15}
            maxZoom={1.75}
            connectionRadius={28}
            connectionLineStyle={{
              stroke: "#2563eb",
              strokeWidth: 1.5,
              strokeDasharray: "4 3",
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#d7dce3"
            />

            {nodes.length > 0 ? (
              <>
                <Panel position="bottom-left" className="!m-3">
                  <CanvasControls />
                </Panel>

                {!selectedEdge ? (
                  <Panel position="bottom-center" className="!m-3">
                    <CanvasStatus
                      nodeCount={nodes.length}
                      edgeCount={edges.length}
                    />
                  </Panel>
                ) : null}

                {nodes.length > 3 ? (
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
              </>
            ) : null}
          </ReactFlow>

          {nodes.length === 0 ? (
            <EmptyState
              onAddTable={addTable}
              onExamples={() => togglePanel("examples")}
              onImport={() => togglePanel("import")}
              onAi={() => togglePanel("ai")}
            />
          ) : null}

          {selectedEdge ? (
            <EdgeInspector
              edge={selectedEdge}
              onChange={(type: RelationType) =>
                setRelationType(selectedEdge.id, type)
              }
              onDelete={handleDeleteEdge}
            />
          ) : null}
        </div>

        {panel !== "none" ? (
          <SidePanel
            key={panel}
            panel={panel}
            sql={sqlResult.sql}
            warnings={sqlResult.warnings}
            onClose={closePanel}
            onRefit={refitCanvas}
          />
        ) : null}
      </div>
    </div>
  );
}
