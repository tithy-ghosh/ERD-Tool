"use client";

import { useState } from "react";
import { AlertCircle, Bot, Info, Loader2 } from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import type { ErdEdge, TableFlowNode } from "@/types/erd";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { labelClass, textareaClass } from "@/components/ui/styles";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

const MAX_PROMPT = 200;

const SUGGESTIONS = [
  "A library with members, books, loans, and fines",
  "An e-commerce store with customers, orders, and products",
  "A school with teachers, courses, students, and enrollments",
];

type GenerateResponse = {
  error?: string;
  nodes?: unknown[];
  edges?: unknown[];
};

type Props = {
  onGenerated?: () => void;
};

export default function AiPanel({ onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWork = useErdStore((state) => state.nodes.length > 0);
  const loadDiagram = useErdStore((state) => state.loadDiagram);

  async function handleGenerate() {
    const text = prompt.trim();
    if (text.length < 3) {
      setError("Please write at least 3 characters.");
      return;
    }

    if (hasWork) {
      const confirmed = await confirmDialog({
        title: "Replace the current diagram?",
        description:
          "Generating a new schema replaces every table and relationship on the canvas. You can undo this action.",
        confirmLabel: "Generate and replace",
        tone: "danger",
      });
      if (!confirmed) return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      let data: GenerateResponse = {};
      try {
        data = (await response.json()) as GenerateResponse;
      } catch {
        // response was not JSON (for example a timeout page)
      }

      if (!response.ok || !data.nodes || !data.edges) {
        setError(
          data.error ?? "Something went wrong. Please try again."
        );
        return;
      }

      loadDiagram(
        data.nodes as TableFlowNode[],
        data.edges as ErdEdge[]
      );
      setPrompt("");
      onGenerated?.();
      toast({
        title: "Diagram generated",
        description: "Review the schema before exporting.",
        tone: "success",
      });
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="ai-prompt" className={labelClass}>
          Describe your schema
        </label>
        <Badge tone="primary">Beta</Badge>
      </div>

      <textarea
        id="ai-prompt"
        value={prompt}
        maxLength={MAX_PROMPT}
        rows={3}
        disabled={loading}
        placeholder="e.g. A library with members, books, loans, and fines."
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            if (!loading) void handleGenerate();
          }
        }}
        className={`${textareaClass} erd-field`}
      />

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setPrompt(suggestion)}
            disabled={loading}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-muted transition-colors hover:border-line-strong hover:bg-surface-subtle hover:text-ink disabled:opacity-50"
          >
            {suggestion.split(" ").slice(0, 3).join(" ")}…
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        icon={loading ? Loader2 : Bot}
        onClick={handleGenerate}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Generating…" : "Generate diagram"}
      </Button>

      {error ? (
        <p
          className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-danger"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        AI can make mistakes. Review the diagram before using it. Do not type
        secrets.
      </p>
    </div>
  );
}
