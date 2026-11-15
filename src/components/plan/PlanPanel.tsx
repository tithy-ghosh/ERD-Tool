"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ClipboardPaste,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  Play,
  Plug,
  ShieldCheck,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fieldClass, labelClass, textareaClass } from "@/components/ui/styles";
import { cn } from "@/lib/cn";
import { findSlowestNode } from "@/lib/planParser";
import { describeNode, formatMs, formatPercent } from "@/lib/planView";
import {
  MAX_PLAN_CHARS,
  usePlanStore,
  type PlanMode,
  type PlanSource,
} from "@/store/usePlanStore";

const MAX_SQL = 5000;

const MODES: { value: PlanMode; title: string; hint: string }[] = [
  {
    value: "explain",
    title: "Explain",
    hint: "Shows the plan only. Your query does not run.",
  },
  {
    value: "analyze",
    title: "Analyze",
    hint: "Runs your query for real timings. It is read-only and stops after 5 seconds.",
  },
];

const SOURCES: { value: PlanSource; title: string; icon: LucideIcon }[] = [
  { value: "paste", title: "Paste plan", icon: ClipboardPaste },
  { value: "connect", title: "Connect", icon: Plug },
];

type Props = {
  // Called when a plan should be shown, so the page can close a bottom sheet
  onRan?: () => void;
};

export default function PlanPanel({ onRan }: Props) {
  const source = usePlanStore((state) => state.source);
  const pastedPlan = usePlanStore((state) => state.pastedPlan);
  const connectionString = usePlanStore((state) => state.connectionString);
  const sql = usePlanStore((state) => state.sql);
  const mode = usePlanStore((state) => state.mode);
  const status = usePlanStore((state) => state.status);
  const error = usePlanStore((state) => state.error);
  const plan = usePlanStore((state) => state.plan);
  const planMode = usePlanStore((state) => state.planMode);
  const viewOpen = usePlanStore((state) => state.viewOpen);
  const setSource = usePlanStore((state) => state.setSource);
  const setPastedPlan = usePlanStore((state) => state.setPastedPlan);
  const setConnectionString = usePlanStore((state) => state.setConnectionString);
  const setSql = usePlanStore((state) => state.setSql);
  const setMode = usePlanStore((state) => state.setMode);
  const runPlan = usePlanStore((state) => state.runPlan);
  const runPastedPlan = usePlanStore((state) => state.runPastedPlan);
  const openView = usePlanStore((state) => state.openView);
  const closeView = usePlanStore((state) => state.closeView);

  const [showSecret, setShowSecret] = useState(false);
  const loading = status === "loading";
  const activeMode = MODES.find((item) => item.value === mode) ?? MODES[0];
  const slowest = plan ? findSlowestNode(plan) : null;

  async function handleConnect() {
    const ok = await runPlan();
    if (ok) onRan?.();
  }

  function handlePaste() {
    const ok = runPastedPlan();
    if (ok) onRan?.();
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <div
        role="tablist"
        aria-label="Plan source"
        className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-subtle p-1"
      >
        {SOURCES.map((item) => {
          const Icon = item.icon;
          const active = source === item.value;

          return (
            <button
              key={item.value}
              id={`plan-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`plan-panel-${item.value}`}
              disabled={loading}
              onClick={() => setSource(item.value)}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                active
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.title}
            </button>
          );
        })}
      </div>

      {source === "paste" ? (
        <div
          id="plan-panel-paste"
          role="tabpanel"
          aria-labelledby="plan-tab-paste"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-json" className={labelClass}>
              Plan JSON
            </label>
            <textarea
              id="plan-json"
              value={pastedPlan}
              rows={8}
              maxLength={MAX_PLAN_CHARS}
              disabled={loading}
              spellCheck={false}
              placeholder={`[
  {
    "Plan": { "Node Type": "Seq Scan" }
  }
]`}
              onChange={(event) => setPastedPlan(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  if (!loading) handlePaste();
                }
              }}
              className={cn(textareaClass, "font-mono text-xs")}
            />
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Run{" "}
              <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[10px] text-ink">
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ...
              </code>{" "}
              in your SQL client, then paste what it returns. No password or
              connection string needed.
            </p>
          </div>

          <Button
            variant="primary"
            icon={FileJson}
            onClick={handlePaste}
            disabled={loading}
            className="w-full"
          >
            Show plan
          </Button>
        </div>
      ) : null}

      {source === "connect" ? (
        <div
          id="plan-panel-connect"
          role="tabpanel"
          aria-labelledby="plan-tab-connect"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-connection" className={labelClass}>
              Database connection string
            </label>
            <div className="relative">
              <input
                id="plan-connection"
                type={showSecret ? "text" : "password"}
                value={connectionString}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                placeholder="postgresql://user:password@host/dbname?sslmode=require"
                onChange={(event) => setConnectionString(event.target.value)}
                className={cn(fieldClass, "pr-10 font-mono text-xs")}
              />
              <button
                type="button"
                onClick={() => setShowSecret((value) => !value)}
                aria-label={showSecret ? "Hide connection string" : "Show connection string"}
                className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {showSecret ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Use a read-only database user. The string is sent to our server only to
              run this one query. It is never saved.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-sql" className={labelClass}>
              Query
            </label>
            <textarea
              id="plan-sql"
              value={sql}
              rows={6}
              maxLength={MAX_SQL}
              disabled={loading}
              spellCheck={false}
              placeholder="select * from orders where user_id = 5"
              onChange={(event) => setSql(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  if (!loading) void handleConnect();
                }
              }}
              className={cn(textareaClass, "font-mono text-xs")}
            />
            <p className="text-[11px] text-ink-subtle">
              One SELECT, WITH or VALUES query. Press Ctrl+Enter to run.
            </p>
          </div>

          <fieldset className="flex flex-col gap-2" disabled={loading}>
            <legend className={cn(labelClass, "mb-1")}>Mode</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mode">
              {MODES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === item.value}
                  onClick={() => setMode(item.value)}
                  className={cn(
                    "h-9 rounded-md border text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                    mode === item.value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-line bg-surface text-ink-muted hover:bg-surface-subtle hover:text-ink"
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <p
              className={cn(
                "text-[11px] leading-relaxed",
                mode === "analyze" ? "text-warning" : "text-ink-muted"
              )}
            >
              {activeMode.hint}
            </p>
          </fieldset>

          <Button
            variant="primary"
            icon={loading ? Loader2 : Play}
            onClick={handleConnect}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? mode === "analyze"
                ? "Analyzing…"
                : "Explaining…"
              : mode === "analyze"
                ? "Analyze query"
                : "Explain query"}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p
          className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-danger"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      {plan ? (
        <section
          aria-label="Last plan"
          className="flex flex-col gap-2.5 rounded-md border border-line bg-surface-subtle p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-ink">Last plan</h3>
            <Badge tone={planMode === "analyze" ? "primary" : "neutral"}>
              {planMode === "analyze" ? "Analyze" : "Explain"}
            </Badge>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-ink-subtle">Execution</dt>
              <dd className="font-medium tabular-nums text-ink">
                {plan.executionTime !== null ? formatMs(plan.executionTime) : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Planning</dt>
              <dd className="font-medium tabular-nums text-ink">
                {plan.planningTime !== null ? formatMs(plan.planningTime) : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Nodes</dt>
              <dd className="font-medium tabular-nums text-ink">{plan.nodeCount}</dd>
            </div>
          </dl>

          {slowest ? (
            <p className="text-xs leading-relaxed text-ink-muted">
              Slowest step:{" "}
              <span className="font-medium text-ink">
                {slowest.nodeType}
                {describeNode(slowest) ? ` ${describeNode(slowest)}` : ""}
              </span>{" "}
              ({formatPercent(slowest.percentOfTotal ?? 0)} of the time)
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-ink-muted">
              Explain has no timings. Use Analyze to see which step is slowest.
            </p>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (viewOpen) {
                closeView();
                return;
              }
              openView();
              onRan?.();
            }}
            className="self-start"
          >
            {viewOpen ? "Hide plan" : "Show plan"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
