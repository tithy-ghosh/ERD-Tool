"use client";

import { useState } from "react";
import { useErdStore } from "@/store/useErdStore";
import { parseSqlToDiagram } from "@/lib/parseSql";
import { FileWarning } from "lucide-react";

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

  const handleImport = async () => {
    setError("");
    setWarnings([]);

    if (!sql.trim()) {
      setError("Paste some CREATE TABLE SQL first.");
      return;
    }

    const hasDiagram = useErdStore.getState().nodes.length > 0;
    if (
      hasDiagram &&
      !window.confirm("Importing will replace the current diagram. Continue?")
    ) {
      return;
    }

    setBusy(true);
    try {
      const result = await parseSqlToDiagram(sql);
      setWarnings(result.warnings);

      if (result.nodes.length === 0) {
        setError("No CREATE TABLE statements were found.");
        return;
      }

      useErdStore.setState({ nodes: result.nodes, edges: result.edges });
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this SQL.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-80 shrink-0 flex-col border-t border-line bg-surface text-sm text-ink">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="font-semibold">Import PostgreSQL SQL</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setSql(SAMPLE_SQL)}
            className="rounded-md border border-line px-3 py-1 hover:bg-primary-soft"
          >
            Load sample
          </button>
          <button
            onClick={handleImport}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "Importing..." : "Import"}
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1 hover:bg-primary-soft"
          >
            Close
          </button>
        </div>
      </div>

      {error && (
        <p className="max-h-20 overflow-auto whitespace-pre-wrap border-b border-line bg-red-50 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="max-h-20 overflow-auto border-b border-line bg-amber-50 px-3 py-2 text-xs text-warning">
          {warnings.map((warning, index) => (
            <li key={index}><FileWarning />{warning}</li>
          ))}
        </ul>
      )}

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="Paste your CREATE TABLE and ALTER TABLE statements here..."
        spellCheck={false}
        className="flex-1 resize-none p-3 font-mono text-xs leading-relaxed outline-none"
      />
    </div>
  );
}