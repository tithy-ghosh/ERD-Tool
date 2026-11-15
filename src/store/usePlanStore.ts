import { create } from "zustand";
import { parsePlan, PlanParseError } from "@/lib/planParser";
import type { ParsedPlan } from "@/types/plan";

export type PlanMode = "explain" | "analyze";
export type PlanStatus = "idle" | "loading" | "done" | "error";
/** "paste" works without credentials, "connect" runs EXPLAIN for you */
export type PlanSource = "paste" | "connect";

/** Keeps a huge paste from freezing the browser before the parser runs */
export const MAX_PLAN_CHARS = 200_000;

type PlanState = {
  // Form
  source: PlanSource;
  pastedPlan: string;
  connectionString: string;
  sql: string;
  mode: PlanMode;

  // Result
  status: PlanStatus;
  error: string | null;
  plan: ParsedPlan | null;
  /** The mode the shown plan was made with */
  planMode: PlanMode | null;
  /** Changes on every successful run, so the plan view can refit itself */
  runId: number;
  viewOpen: boolean;

  setConnectionString: (value: string) => void;
  setSql: (value: string) => void;
  setMode: (mode: PlanMode) => void;
  setSource: (source: PlanSource) => void;
  setPastedPlan: (value: string) => void;
  runPlan: () => Promise<boolean>;
  runPastedPlan: () => boolean;
  openView: () => void;
  closeView: () => void;
};

type ExplainResponse = { error?: string; plan?: unknown };

// NOTE: this store is NOT persisted on purpose. The connection string contains
// a password, so it only lives in memory until the tab is closed.
export const usePlanStore = create<PlanState>()((set, get) => ({
  source: "paste",
  pastedPlan: "",
  connectionString: "",
  sql: "",
  mode: "explain",

  status: "idle",
  error: null,
  plan: null,
  planMode: null,
  runId: 0,
  viewOpen: false,

  setConnectionString: (connectionString) => set({ connectionString }),
  setSql: (sql) => set({ sql }),
  setMode: (mode) => set({ mode }),
  setSource: (source) =>
    set((state) => ({
      source,
      error: null,
      status: state.status === "error" ? "idle" : state.status,
    })),
  setPastedPlan: (pastedPlan) => set({ pastedPlan }),

  runPastedPlan: () => {
    const { pastedPlan, status } = get();
    if (status === "loading") return false;

    const trimmed = pastedPlan.trim();
    if (!trimmed) {
      set({ status: "error", error: "Paste a plan first." });
      return false;
    }
    if (trimmed.length > MAX_PLAN_CHARS) {
      set({ status: "error", error: "That plan is too large to paste." });
      return false;
    }

    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch {
      set({
        status: "error",
        error:
          "That is not valid JSON. Paste the result of EXPLAIN (FORMAT JSON), not the text plan.",
      });
      return false;
    }

    try {
      const plan = parsePlan(data);
      set((state) => ({
        status: "done",
        error: null,
        plan,
        // The plan itself tells us whether it has real timings
        planMode: plan.hasActuals ? "analyze" : "explain",
        runId: state.runId + 1,
        viewOpen: true,
      }));
      return true;
    } catch (error) {
      set({
        status: "error",
        error:
          error instanceof PlanParseError
            ? error.message
            : "The plan could not be read.",
      });
      return false;
    }
  },

  runPlan: async () => {
    const { connectionString, sql, mode, status } = get();
    if (status === "loading") return false;

    if (!connectionString.trim()) {
      set({ status: "error", error: "Paste your connection string first." });
      return false;
    }
    if (!sql.trim()) {
      set({ status: "error", error: "Write a query first." });
      return false;
    }

    set({ status: "loading", error: null });

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: connectionString.trim(),
          sql,
          mode,
        }),
      });

      let data: ExplainResponse = {};
      try {
        data = (await response.json()) as ExplainResponse;
      } catch {
        // the answer was not JSON (for example a timeout page)
      }

      if (!response.ok || data.plan === undefined) {
        set({
          status: "error",
          error: data.error ?? "Something went wrong. Please try again.",
        });
        return false;
      }

      const plan = parsePlan(data.plan);
      set((state) => ({
        status: "done",
        error: null,
        plan,
        planMode: mode,
        runId: state.runId + 1,
        viewOpen: true,
      }));
      return true;
    } catch (error) {
      set({
        status: "error",
        error:
          error instanceof PlanParseError
            ? "The plan from the database could not be read."
            : "Network error. Please check your connection.",
      });
      return false;
    }
  },

  openView: () => set({ viewOpen: true }),
  closeView: () => set({ viewOpen: false }),
}));