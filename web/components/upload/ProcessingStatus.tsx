"use client";

import { useRef, useEffect } from "react";
import { useUploadStore } from "@/lib/upload-store";

const STEPS = [
  { key: "uploading", label: "Upload video" },
  { key: "transcribing", label: "Transcribe audio" },
  { key: "aligning", label: "Align script" },
  { key: "done", label: "Complete" },
] as const;

function stepStatus(
  step: (typeof STEPS)[number]["key"],
  currentPhase: string,
): "pending" | "active" | "done" | "error" {
  const order = STEPS.map((s) => s.key);
  const currentIdx = order.indexOf(currentPhase as any);
  const stepIdx = order.indexOf(step);

  if (currentPhase === "error") {
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "error";
    return "pending";
  }

  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function ProcessingStatus() {
  const phase = useUploadStore((s) => s.phase);
  const logs = useUploadStore((s) => s.logs);
  const errorMessage = useUploadStore((s) => s.errorMessage);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  if (phase === "idle") return null;

  return (
    <div>
      {/* Step indicators */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {STEPS.map((step) => {
          const status = stepStatus(step.key, phase);
          return (
            <div
              key={step.key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  height: 3,
                  width: "100%",
                  borderRadius: 2,
                  background:
                    status === "done"
                      ? "var(--success)"
                      : status === "active"
                        ? "var(--accent)"
                        : status === "error"
                          ? "var(--error)"
                          : "var(--border)",
                  transition: "background 0.3s ease",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color:
                    status === "active"
                      ? "var(--accent)"
                      : status === "done"
                        ? "var(--success)"
                        : status === "error"
                          ? "var(--error)"
                          : "var(--text-muted)",
                  fontWeight: status === "active" ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--error)",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Live logs */}
      <div
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          maxHeight: 200,
          overflowY: "auto",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 11,
          lineHeight: 1.5,
          color: "var(--text-secondary)",
        }}
      >
        {logs.map((line, i) => (
          <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {line}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
