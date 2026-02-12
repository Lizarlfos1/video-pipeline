"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";

export default function RunPicker() {
  const runs = useEditorStore((s) => s.runs);
  const currentRunId = useEditorStore((s) => s.currentRunId);
  const fetchRuns = useEditorStore((s) => s.fetchRuns);
  const loadRun = useEditorStore((s) => s.loadRun);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
      <label
        className="text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        Run
      </label>
      <select
        value={currentRunId || ""}
        onChange={(e) => e.target.value && loadRun(e.target.value)}
        className="flex-1 text-sm"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          borderRadius: 6,
          padding: "4px 8px",
        }}
      >
        <option value="">Select a run...</option>
        {runs.map((run) => (
          <option key={run.id} value={run.id}>
            {run.id}
            {run.hasEdits ? ` (${run.shortsCount} shorts)` : ""}
            {!run.hasARoll ? " [no video]" : ""}
          </option>
        ))}
      </select>
      <button
        onClick={() => fetchRuns()}
        className="text-xs px-2 py-1 rounded"
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        Refresh
      </button>
    </div>
  );
}
