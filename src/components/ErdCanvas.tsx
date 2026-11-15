"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RelationEdge from "@/components/RelationEdge";
import TableNode from "@/components/TableNode";
import AppHeader from "@/components/erd/AppHeader";
import BottomBar from "@/components/erd/BottomBar";
import DocumentToolsPanel from "@/components/erd/DocumentToolsPanel";
import { EditorUiProvider } from "@/components/erd/EditorUi";
import EmptyState from "@/components/erd/EmptyState";
import SidePanel from "@/components/erd/SidePanel";
import ToolRail from "@/components/erd/ToolRail";
import PlanView from "@/components/plan/PlanView";
import type { PanelState, PanelTarget } from "@/components/erd/types";
import { exportDiagramAsPng } from "@/lib/exportPng";
import { generateSql } from "@/lib/generateSql";
import { useErdShortcuts } from "@/lib/useErdShortcuts";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { useErdStore } from "@/store/useErdStore";
import { usePlanStore } from "@/store/usePlanStore";
import type { ErdEdge, TableFlowNode } from "@/types/erd";

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
  const clearAll = useErdStore((state) => state.clearAll);
  const undo = useErdStore((state) => state.undo);
  const redo = useErdStore((state) => state.redo);
  const canUndo = useErdStore((state) => state.past.length > 0);
  const canRedo = useErdStore((state) => state.future.length > 0);
  const highlightTables = useErdStore((state) => state.highlightTables);
  const clearHighlights = useErdStore((state) => state.clearHighlights);
  const planViewOpen = usePlanStore((state) => state.viewOpen);
  const revealRequest = usePlanStore((state) => state.revealRequest);
  const clearRevealRequest = usePlanStore((state) => state.clearRevealRequest);

  const [panel, setPanel] = useState<PanelState>("none");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
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

  // "Show on diagram" from the plan view: highlight the matching tables and zoom
  // to them. The plan overlay closes in the same state update.
  useEffect(() => {
    if (!revealRequest) {
      clearHighlights();
      return;
    }
    if (revealRequest.tableIds.length === 0) {
      clearRevealRequest();
      clearHighlights();
      return;
    }

    // Highlight the tables from the plan
    highlightTables(revealRequest.tableIds);

    // Also select them for the toolbar
    const ids = new Set(revealRequest.tableIds);
    const current = useErdStore.getState();
    useErdStore.setState({
      nodes: current.nodes.map((node) => ({
        ...node,
        selected: ids.has(node.id),
      })),
      edges: current.edges.map((edge) => ({ ...edge, selected: false })),
    });

    // Wait for the overlay to close and the new selection to render
    const timer = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      flowRef.current?.fitView({
        nodes: revealRequest.tableIds.map((id) => ({ id })),
        padding: revealRequest.tableIds.length === 1 ? 0.8 : 0.35,
        maxZoom: 1.25,
        duration: reduceMotion ? 0 : 300,
      });
      clearRevealRequest();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [revealRequest, clearRevealRequest, highlightTables, clearHighlights]);

  const sqlResult = useMemo(() => generateSql(nodes), [nodes]);
  const selectedEdge = edges.find((edge) => edge.selected) ?? null;
  const selectedNode = nodes.find((node) => node.selected) ?? null;

  const flowEdges = useMemo<ErdEdge[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        type: "relation",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#b1baad",
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

  const openProperties = (tableId?: string) => {
    if (tableId) {
      const current = useErdStore.getState();
      useErdStore.setState({
        nodes: current.nodes.map((node) => ({
          ...node,
          selected: node.id === tableId,
        })),
        edges: current.edges.map((edge) => ({ ...edge, selected: false })),
      });
    }
    setPanel("properties");
  };

  // On small screens the panel is a bottom sheet that would hide the new plan
  const handlePlanReady = () => {
    if (!window.matchMedia("(min-width: 1024px)").matches) closePanel();
  };

  useErdShortcuts({
    onAddTable: addTable,
    onClosePanel: closePanel,
    enabled: !planViewOpen,
  });

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
    const current = useErdStore.getState();
    useErdStore.setState({
      nodes: current.nodes.map((node) => ({
        ...node,
        selected: node.id === tableId,
      })),
      edges: current.edges.map((edge) => ({ ...edge, selected: false })),
    });
    flowRef.current?.fitView({
      nodes: [{ id: tableId }],
      padding: 2,
      maxZoom: 1.2,
      duration: 260,
    });
  };

  const zoomIn = () => flowRef.current?.zoomIn({ duration: 120 });
  const zoomOut = () => flowRef.current?.zoomOut({ duration: 120 });
  const resetZoom = () => flowRef.current?.zoomTo(1, { duration: 160 });
  const fitView = () =>
    flowRef.current?.fitView({ padding: 0.2, maxZoom: 1.2, duration: 220 });

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
      <AppHeader
        panel={panel}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
        onAddTable={addTable}
        onTogglePanel={togglePanel}
        onExportPng={handleExportPng}
        onClear={handleClear}
      />

      <div className="relative flex min-h-0 flex-1">
        <ToolRail
          panel={panel}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onAddTable={addTable}
          onTogglePanel={togglePanel}
        />

        {sidebarOpen ? (
          <DocumentToolsPanel
            onFocusTable={focusTable}
            onCollapse={() => setSidebarOpen(false)}
          />
        ) : null}

        <EditorUiProvider openProperties={openProperties}>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <ReactFlow
                key={canvasKey}
                nodes={nodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={(instance) => {
                  flowRef.current = instance;
                  setZoom(instance.getZoom());
                }}
                onMove={(_, viewport) => setZoom(viewport.zoom)}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1.15 }}
                minZoom={0.15}
                maxZoom={1.75}
                connectionRadius={28}
                deleteKeyCode={planViewOpen ? null : "Backspace"}
                connectionLineStyle={{
                  stroke: "#65a30d",
                  strokeWidth: 1.5,
                  strokeDasharray: "4 3",
                }}
              >
                <Background
                  variant={BackgroundVariant.Lines}
                  gap={20}
                  size={1}
                  color="#e8ece2"
                />

                {nodes.length > 3 ? (
                  <MiniMap
                    pannable
                    zoomable
                    className="!m-3 hidden xl:block"
                    style={{ width: 160, height: 104 }}
                    nodeColor="#d2d9cb"
                    nodeStrokeColor="#b1baad"
                    nodeBorderRadius={4}
                    maskColor="rgba(33, 38, 32, 0.06)"
                  />
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
            </div>

            <BottomBar
              nodeCount={nodes.length}
              edgeCount={edges.length}
              canUndo={canUndo}
              canRedo={canRedo}
              zoom={zoom}
              onUndo={undo}
              onRedo={redo}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              onFitView={fitView}
            />

            <PlanView />
          </div>
        </EditorUiProvider>

        {panel !== "none" ? (
          <SidePanel
            key={panel}
            panel={panel}
            sql={sqlResult.sql}
            warnings={sqlResult.warnings}
            table={selectedNode}
            edge={selectedEdge}
            onClose={closePanel}
            onRefit={refitCanvas}
            onPlanReady={handlePlanReady}
          />
        ) : null}
      </div>
    </div>
  );
}
