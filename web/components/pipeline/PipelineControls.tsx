"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import type { PipelineStage } from "@/lib/types";

const STAGES: { key: PipelineStage; label: string; description: string }[] = [
  {
    key: "pull",
    label: "Pull",
    description: "Download video & assets from Drive",
  },
  {
    key: "transcribe",
    label: "Transcribe",
    description: "Transcribe audio with Whisper",
  },
  {
    key: "analyze",
    label: "Auto Edit",
    description: "AI generates shorts from transcript",
  },
  {
    key: "edit",
    label: "Render",
    description: "FFmpeg renders the short video",
  },
  {
    key: "subtitles",
    label: "Subtitles",
    description: "Add animated captions",
  },
];

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  idle: { icon: "○", color: "var(--text-muted)" },
  running: { icon: "◎", color: "var(--accent)" },
  success: { icon: "●", color: "var(--success)" },
  error: { icon: "●", color: "var(--error)" },
};

export default function PipelineControls() {
  const currentRunId = useEditorStore((s) => s.currentRunId);
  const pipelineStatus = useEditorStore((s) => s.pipelineStatus);
  const pipelineLogs = useEditorStore((s) => s.pipelineLogs);
  const activeJob = useEditorStore((s) => s.activeJob);
  const triggerStage = useEditorStore((s) => s.triggerStage);

  const [showLogs, setShowLogs] = useState(false);
  const [pullSource, setPullSource] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pipelineLogs]);

  return (
    <div className="flex flex-col gap-1 p-2">
      <div
        className="text-xs font-semibold uppercase tracking-wider px-2 py-1"
        style={{ color: "var(--text-muted)" }}
      >
        Pipeline
      </div>

      {STAGES.map(({ key, label, description }) => {
        const status = pipelineStatus[key];
        const { icon, color } = STATUS_ICONS[status];
        const isRunning = status === "running";
        const isDisabled =
          isRunning || (!currentRunId && key !== "pull");

        return (
          <div key={key}>
            {key === "pull" && (
              <input
                type="text"
                placeholder="Drive ID or local path..."
                value={pullSource}
                onChange={(e) => setPullSource(e.target.value)}
                className="w-full text-xs mb-1 px-2 py-1.5 rounded"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            )}
            <button
              onClick={() => {
                const extra: Record<string, unknown> = {};
                if (key === "pull" && pullSource) {
                  extra.source = pullSource;
                }
                triggerStage(key, extra);
                setShowLogs(true);
              }}
              disabled={isDisabled}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
              style={{
                background: isRunning
                  ? "var(--accent-muted)"
                  : "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                opacity: isDisabled && !isRunning ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              <span
                style={{ color, fontSize: 14 }}
                className={isRunning ? "animate-pulse" : ""}
              >
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium"
                  style={{
                    color: isRunning
                      ? "var(--accent)"
                      : "var(--text-primary)",
                  }}
                >
                  {label}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {description}
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {/* Log viewer */}
      {showLogs && pipelineLogs.length > 0 && (
        <div
          className="mt-2 rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Logs
            </span>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs px-1"
              style={{ color: "var(--text-muted)" }}
            >
              ×
            </button>
          </div>
          <div
            className="p-2 overflow-y-auto font-mono text-xs leading-relaxed"
            style={{
              maxHeight: 160,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {pipelineLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
