"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileCode2,
} from "lucide-react";
import PanelShell from "@/components/PanelShell";
import Button from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";

type Props = {
  sql: string;
  warnings: string[];
  onClose: () => void;
};

export default function SqlPanel({ sql, warnings, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!sql) return;

    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      toast({ title: "SQL copied", tone: "success" });
    } catch {
      toast({
        title: "Could not copy",
        description: "Select the SQL and copy it manually.",
        tone: "error",
      });
    }
  };

  const download = () => {
    if (!sql) return;

    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schema.sql";
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "schema.sql downloaded", tone: "success" });
  };

  return (
    <PanelShell
      title="SQL output"
      eyebrow="PostgreSQL · ready to run"
      icon={<FileCode2 className="h-4 w-4" />}
      onClose={onClose}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      toolbar={
        <>
          <Button
            size="sm"
            variant="primary"
            icon={copied ? Check : Copy}
            onClick={copy}
            disabled={!sql}
          >
            {copied ? "Copied" : "Copy SQL"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={download}
            disabled={!sql}
          >
            Download .sql
          </Button>
        </>
      }
    >
      {warnings.length > 0 ? (
        <div className="shrink-0 border-b border-warning/20 bg-warning-soft px-4 py-3 md:px-5">
          <ul className="space-y-1.5 text-[11px] leading-relaxed text-warning">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <pre
        aria-label="Generated SQL"
        className="erd-code min-h-0 flex-1 overflow-auto bg-code p-4 font-mono text-[12px] leading-relaxed text-code-text md:p-5"
      >
        {sql || (
          <span className="text-code-text/40">
            -- Add a table to the canvas to generate SQL
          </span>
        )}
      </pre>
    </PanelShell>
  );
}
