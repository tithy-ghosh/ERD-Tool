"use client";

import { useState } from "react";
import { useErdStore } from "@/store/useErdStore";

export default function SharePanel() {
  const nodes = useErdStore((s) => s.nodes);
  const edges = useErdStore((s) => s.edges);

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
      const res = await fetch("/api/diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nodes, edges }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "Could not create the share link.");
        return;
      }

      setLink(`${window.location.origin}/d/${body.id}`);
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
    } catch {
      setError("Could not copy. Please copy the link manually.");
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <label className="text-sm font-medium text-ink">Diagram name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        className="rounded border border-line bg-surface px-3 py-2 text-sm"
      />

      <button
        onClick={handleShare}
        disabled={loading}
        className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create share link"}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      {link && (
        <div className="flex flex-col gap-2">
          <input
            readOnly
            value={link}
            className="rounded border border-line bg-surface px-3 py-2 text-sm"
          />
          <button
            onClick={handleCopy}
            className="rounded border border-line px-3 py-2 text-sm"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}