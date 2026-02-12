"use client";

import Link from "next/link";
import { useUploadStore } from "@/lib/upload-store";
import DropZone from "@/components/upload/DropZone";
import ScriptInput from "@/components/upload/ScriptInput";
import ProcessingStatus from "@/components/upload/ProcessingStatus";
import ResultsList from "@/components/upload/ResultsList";

export default function Home() {
  const file = useUploadStore((s) => s.file);
  const script = useUploadStore((s) => s.script);
  const phase = useUploadStore((s) => s.phase);
  const process = useUploadStore((s) => s.process);
  const reset = useUploadStore((s) => s.reset);

  const canProcess = file !== null && script.trim().length > 0 && phase === "idle";
  const isProcessing = phase === "uploading" || phase === "transcribing" || phase === "aligning";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Video Pipeline
          </span>
        </div>
        <Link
          href="/editor"
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
          }}
        >
          Open Editor
        </Link>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Title */}
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            Create shorts from your recording
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Upload your a-roll video and paste the script you recorded from.
            The tool will transcribe, find the best takes, remove silences,
            and split into shorts.
          </p>
        </div>

        {/* Inputs */}
        <DropZone />
        <ScriptInput />

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={process}
            disabled={!canProcess}
            style={{
              flex: 1,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 600,
              color: canProcess ? "#fff" : "var(--text-muted)",
              background: canProcess ? "var(--accent)" : "var(--bg-elevated)",
              borderRadius: 10,
              transition: "all 0.15s",
              cursor: canProcess ? "pointer" : "default",
            }}
          >
            {isProcessing ? "Processing..." : "Process"}
          </button>

          {(phase === "done" || phase === "error") && (
            <button
              onClick={reset}
              style={{
                padding: "12px 20px",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
                borderRadius: 10,
              }}
            >
              Start over
            </button>
          )}
        </div>

        {/* Processing status / logs */}
        <ProcessingStatus />

        {/* Results */}
        <ResultsList />
      </main>
    </div>
  );
}
