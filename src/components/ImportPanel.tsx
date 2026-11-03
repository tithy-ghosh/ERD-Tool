"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  FileInput,
  FileWarning,
  Loader2,
  Upload,
} from "lucide-react";
import { useErdStore } from "@/store/useErdStore";
import { parseSqlToDiagram } from "@/lib/parseSql";
import PanelShell from "@/components/PanelShell";
import Button from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

type Props = {
  onClose: () => void;
  onImported: () => void;
};

const SAMPLE_SQL = `CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  department_id INTEGER
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE enrollments (
  student_id INTEGER,
  course_id INTEGER,
  PRIMARY KEY (student_id, course_id)
);

ALTER TABLE students
  ADD CONSTRAINT fk_students_department
  FOREIGN KEY (department_id)
  REFERENCES departments (id);

ALTER TABLE enrollments
  ADD CONSTRAINT fk_enrollments_student
  FOREIGN KEY (student_id)
  REFERENCES students (id);

ALTER TABLE enrollments
  ADD CONSTRAINT fk_enrollments_course
  FOREIGN KEY (course_id)
  REFERENCES courses (id);`;

export default function ImportPanel({ onClose, onImported }: Props) {
  const [sql, setSql] = useState("");
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadDiagram = useErdStore((state) => state.loadDiagram);

  const handleImport = async () => {
    setError("");
    setWarnings([]);

    if (!sql.trim()) {
      setError("Paste some CREATE TABLE SQL first.");
      return;
    }

    const hasDiagram = useErdStore.getState().nodes.length > 0;
    if (hasDiagram) {
      const confirmed = await confirmDialog({
        title: "Replace the current diagram?",
        description:
          "Importing this SQL replaces every table and relationship on the canvas. You can undo this action.",
        confirmLabel: "Import and replace",
        tone: "danger",
      });
      if (!confirmed) return;
    }

    setBusy(true);
    try {
      const result = await parseSqlToDiagram(sql);
      setWarnings(result.warnings);

      if (result.nodes.length === 0) {
        setError("No CREATE TABLE statements were found.");
        return;
      }

      loadDiagram(result.nodes, result.edges);
      onImported();
      toast({
        title: "SQL imported",
        description: `${result.nodes.length} ${
          result.nodes.length === 1 ? "table" : "tables"
        } added to the canvas.`,
        tone: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this SQL.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      setSql(text);
      setError("");
    } catch {
      setError("Could not read that file.");
    }
  };

  return (
    <PanelShell
      title="Import SQL"
      eyebrow="Paste PostgreSQL DDL to rebuild the diagram"
      icon={<FileInput className="h-4 w-4" />}
      onClose={onClose}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      footer={
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSql(SAMPLE_SQL)}
          >
            Load sample
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={Upload}
            onClick={() => fileRef.current?.click()}
          >
            Upload .sql
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={busy ? Loader2 : Upload}
            onClick={handleImport}
            disabled={busy}
          >
            {busy ? "Importing…" : "Import"}
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".sql,text/plain"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? (
        <div
          className="m-4 flex shrink-0 items-start gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-danger"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="max-h-28 shrink-0 overflow-y-auto border-b border-warning/20 bg-warning-soft px-4 py-2.5 md:px-5">
          <ul className="space-y-1 text-[11px] leading-relaxed text-warning">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <textarea
        value={sql}
        onChange={(event) => setSql(event.target.value)}
        placeholder="Paste your CREATE TABLE and ALTER TABLE statements here…"
        spellCheck={false}
        aria-label="SQL to import"
        className="erd-field erd-code min-h-0 flex-1 resize-none bg-code p-4 font-mono text-[12px] leading-relaxed text-code-text outline-none placeholder:text-code-text/45 md:p-5"
      />
    </PanelShell>
  );
}
