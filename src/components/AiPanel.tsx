"use client";

import { useState } from "react";
import { useErdStore } from "@/store/useErdStore";
import type { ErdEdge, TableFlowNode } from "@/types/erd";

const MAX_PROMPT = 200;

type GenerateResponse = {
  error?: string;
  nodes?: unknown[];
  edges?: unknown[];
};

export default function AiPanel() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWork = useErdStore((s) => s.nodes.length > 0);

  async function handleGenerate() {
    const text = prompt.trim();
    if (text.length < 3) {
      setError("Please write at least 3 characters.");
      return;
    }
    if (hasWork && !window.confirm("This will replace your current diagram. Continue?")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      let data: GenerateResponse = {};
      try {
        data = (await res.json()) as GenerateResponse;
      } catch {
        // response was not JSON (for example a timeout page)
      }

      if (!res.ok || !data.nodes || !data.edges) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      useErdStore.setState({
        nodes: data.nodes as TableFlowNode[],
        edges: data.edges as ErdEdge[],
      });
      setPrompt("");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line bg-surface p-3">
      <label htmlFor="ai-prompt" className="text-sm font-medium text-ink">
        Describe your system
      </label>
      <div className="flex gap-2">
        <input
          id="ai-prompt"
          type="text"
          value={prompt}
          maxLength={MAX_PROMPT}
          disabled={loading}
          placeholder="e.g. library management system"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleGenerate();
          }}
          className="flex-1 rounded border border-line bg-canvas px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-ink-muted">
        AI can make mistakes. Please review the diagram before using it. Do not type secrets.
      </p>
    </div>
  );
}