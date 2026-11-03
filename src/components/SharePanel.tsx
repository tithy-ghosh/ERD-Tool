"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Loader2,
  Share2,
} from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import Button from "@/components/ui/Button";
import { fieldClass, labelClass } from "@/components/ui/styles";
import { toast } from "@/components/ui/toast";

export default function SharePanel() {
  const nodes = useErdStore((state) => state.nodes);
  const edges = useErdStore((state) => state.edges);

  const [name, setName] = useState("My diagram");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setError("");
    setLink("");
    setCopied(false);

    if (nodes.length === 0) {
      setError("Add at least one table before sharing.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nodes, edges }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error ?? "Could not create the share link.");
        return;
      }

      setLink(`${window.location.origin}/d/${body.id}`);
      toast({ title: "Share link created", tone: "success" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast({ title: "Link copied", tone: "success" });
    } catch {
      setError("Could not copy. Please copy the link manually.");
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="diagram-name" className={labelClass}>
          Diagram name
        </label>
        <input
          id="diagram-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          className={fieldClass}
        />
      </div>

      <Button
        variant="primary"
        icon={loading ? Loader2 : Share2}
        onClick={handleShare}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Creating link…" : "Create share link"}
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

      {link ? (
        <div className="rounded-lg border border-line bg-surface-subtle p-3 animate-soft-fade">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Read-only link
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              aria-label="Share link"
              className={`${fieldClass} min-w-0 flex-1`}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              size="sm"
              variant="secondary"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-ink-muted">
        The link stores a snapshot of this diagram. Anyone with the link can
        view it, but cannot edit it.
      </p>
    </div>
  );
}
