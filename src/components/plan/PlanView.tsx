"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import { ArrowLeft, LocateFixed } from "lucide-react";
import CanvasControls from "@/components/erd/CanvasControls";
import PlanNodeCard from "@/components/plan/PlanNodeCard";
import PlanDetailPanel from "@/components/plan/PlanDetailPanel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  collectDiagramTableNames,
  diagramTableIdsForNode,
  diagramTableIdsForPlan,
} from "@/lib/diagramMatch";
import { adviceForNode, buildAdvice } from "@/lib/planAdvice";
import { flattenPlan } from "@/lib/planParser";
import { buildPlanGraph, formatMs, HEAT_COLORS, type HeatLevel } from "@/lib/planView";
import { useErdStore } from "@/store/useErdStore";
import { usePlanStore } from "@/store/usePlanStore";

const nodeTypes = { plan: PlanNodeCard };
const LEGEND_LEVELS: HeatLevel[] = [0, 1, 2, 3, 4];

// Full-size view that covers the diagram canvas while a plan is shown.
export default function PlanView() {
  const plan = usePlanStore((state) => state.plan);
  const planMode = usePlanStore((state) => state.planMode);
  const runId = usePlanStore((state) => state.runId);
  const viewOpen = usePlanStore((state) => state.viewOpen);
  const closeView = usePlanStore((state) => state.closeView);
  const selectedNodeId = usePlanStore((state) => state.selectedNodeId);
  const setSelectedNodeId = usePlanStore((state) => state.setSelectedNodeId);
  const revealTables = usePlanStore((state) => state.revealTables);
  const erdNodes = useErdStore((state) => state.nodes);

  const diagramNames = useMemo(
    () => collectDiagramTableNames(erdNodes),
    [erdNodes]
  );

  const planTableIds = useMemo(
    () => (plan ? diagramTableIdsForPlan(plan, erdNodes) : []),
    [plan, erdNodes]
  );

  const graph = useMemo(() => {
    if (!plan) return null;
    const built = buildPlanGraph(plan, diagramNames);
    return {
      nodes: built.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
      edges: built.edges.map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 12, height: 12 },
      })),
    };
  }, [plan, selectedNodeId, diagramNames]);

  const advice = useMemo(() => (plan ? buildAdvice(plan) : []), [plan]);

  const selectedNode = useMemo(() => {
    if (!plan || !selectedNodeId) return null;
    return flattenPlan(plan.root).find((node) => node.id === selectedNodeId) ?? null;
  }, [plan, selectedNodeId]);

  const selectedAdvice = useMemo(
    () => (selectedNode ? adviceForNode(advice, selectedNode.id) : []),
    [advice, selectedNode]
  );

  const selectedTableIds = useMemo(
    () => (selectedNode ? diagramTableIdsForNode(selectedNode, erdNodes) : []),
    [selectedNode, erdNodes]
  );

  useEffect(() => {
    if (!viewOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (!isEditable && event.key === "Escape") {
        if (selectedNodeId) {
          setSelectedNodeId(null);
          return;
        }
        closeView();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewOpen, closeView, selectedNodeId, setSelectedNodeId]);

  if (!plan || !graph || !viewOpen) return null;

  return (
    <section
      aria-label="Query plan tree"
      className="absolute inset-0 z-20 flex flex-col bg-canvas animate-soft-fade touch-none"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-3 py-2">
        <Button icon={ArrowLeft} variant="ghost" size="sm" onClick={closeView}>
          Back to diagram
        </Button>
        <span className="h-5 w-px bg-line" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-ink">Query plan</h2>
        <Badge tone={planMode === "analyze" ? "primary" : "neutral"}>
          {planMode === "analyze" ? "Analyze" : "Explain"}
        </Badge>
        {advice.length > 0 ? (
          <Badge tone="warning">
            {advice.length} {advice.length === 1 ? "tip" : "tips"}
          </Badge>
        ) : null}

        <p className="hidden text-[11px] text-ink-subtle sm:block">
          Click a node to see its details
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {planTableIds.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              icon={LocateFixed}
              onClick={() => revealTables(planTableIds)}
              title={`${planTableIds.length} matching ${
                planTableIds.length === 1 ? "table" : "tables"
              } in your diagram`}
            >
              Show on diagram
            </Button>
          ) : null}

          <p className="text-[11px] tabular-nums text-ink-muted">
            {plan.executionTime !== null ? (
              <>Execution {formatMs(plan.executionTime)} · </>
            ) : null}
            {plan.planningTime !== null ? <>Planning {formatMs(plan.planningTime)} · </> : null}
            {plan.nodeCount} {plan.nodeCount === 1 ? "node" : "nodes"}
          </p>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            key={runId}
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
            minZoom={0.1}
            maxZoom={1.75}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            preventScrolling={false}
            zoomOnScroll={false}
            panOnScroll={false}
            panOnDrag={true}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d7dce3" />

            <Panel position="bottom-left" className="!m-3">
              <CanvasControls />
            </Panel>

            <Panel position="bottom-right" className="!m-3">
              <div className="rounded-md border border-line bg-surface px-2.5 py-2 shadow-[0_4px_12px_-8px_rgba(15,23,42,0.25)]">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
                  {plan.hasActuals ? "Share of query time" : "Share of plan cost"}
                </p>
                <ul className="flex flex-col gap-1">
                  {LEGEND_LEVELS.map((level) => (
                    <li key={level} className="flex items-center gap-2 text-[11px] text-ink-muted">
                      <span
                        className="h-2.5 w-5 rounded-sm border"
                        style={{
                          background: HEAT_COLORS[level].bar,
                          borderColor: HEAT_COLORS[level].border,
                        }}
                        aria-hidden="true"
                      />
                      {HEAT_COLORS[level].label}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {selectedNode ? (
          <PlanDetailPanel
            node={selectedNode}
            hasActuals={plan.hasActuals}
            advice={selectedAdvice}
            onClose={() => setSelectedNodeId(null)}
            onShowOnDiagram={
              selectedTableIds.length > 0
                ? () => revealTables(selectedTableIds)
                : undefined
            }
          />
        ) : null}
      </div>
    </section>
  );
}