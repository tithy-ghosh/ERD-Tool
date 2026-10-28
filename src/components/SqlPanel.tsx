"use client";

import { useState } from "react";

type Props = {
  sql: string;
  warnings: string[];
  onClose: () => void;
};

export default function SqlPanel({ sql, warnings, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert(
        "Could not copy. Please select the text and copy it manually.",
      );
    }
  };
  const download = () => {
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schema.sql";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-line bg-surface text-sm text-ink">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="font-semibold">PostgreSQL SQL</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={copy}
            disabled={!sql}
            className="rounded-md bg-primary px-3 py-1 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={download}
            disabled={!sql}
            className="rounded-md border border-line px-3 py-1 hover:bg-primary-soft disabled:opacity-50"
          >
            Download .sql
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1 hover:bg-primary-soft"
          >
            Close
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="border-b border-line bg-amber-50 px-3 py-2 text-xs text-warning">
          {warnings.map((warning, index) => (
            <li key={index}>⚠ {warning}</li>
          ))}
        </ul>
      )}

      <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed">
        {sql || "-- Add a table to the canvas first"}
      </pre>
    </div>
  );
}
