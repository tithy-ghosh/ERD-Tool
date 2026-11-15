import { create } from "zustand";
import { parsePlan, PlanParseError } from "@/lib/planParser";
import type { ParsedPlan } from "@/types/plan";

export type PlanMode = "explain" | "analyze";
export type PlanStatus = "idle" | "loading" | "done" | "error";

type PlanState = {
  // Form
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
  runPlan: () => Promise<boolean>;
  openView: () => void;
  closeView: () => void;
};

type ExplainResponse = { error?: string; plan?: unknown };

// NOTE: this store is NOT persisted on purpose. The connection string contains
// a password, so it only lives in memory until the tab is closed.
export const usePlanStore = create<PlanState>()((set, get) => ({
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