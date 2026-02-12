"use client";

import { useUploadStore } from "@/lib/upload-store";
import { useRouter } from "next/navigation";

export default function ResultsList() {
  const shorts = useUploadStore((s) => s.shorts);
  const runId = useUploadStore((s) => s.runId);
  const phase = useUploadStore((s) => s.phase);
  const router = useRouter();

  if (phase !== "done" || shorts.length === 0) return null;

  return (
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 12px",
        }}
      >
        {shorts.length} short{shorts.length !== 1 ? "s" : ""} generated
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shorts.map((short) => {
          const duration = short.segmentsToKeep.reduce(
            (sum, seg) => sum + (seg.end - seg.start),
            0,
          );
          const mins = Math.floor(duration / 60);
          const secs = Math.round(duration % 60);

          return (
            <div
              key={short.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            >
              {/* Short number badge */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {short.id}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {short.title}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                  {mins}:{secs.toString().padStart(2, "0")} &middot;{" "}
                  {short.segmentsToKeep.length} segment{short.segmentsToKeep.length !== 1 ? "s" : ""} &middot;{" "}
                  {short.subtitleWords.length} words
                </p>
              </div>

              {/* Edit button */}
              <button
                onClick={() => router.push(`/editor?run=${runId}&short=${short.id}`)}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--accent)",
                  background: "var(--accent-muted)",
                  borderRadius: 6,
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
              >
                Open in Editor
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
