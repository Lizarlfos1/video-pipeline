"use client";

import { useEditorStore } from "@/lib/store";
import { totalConcatDuration, formatTimeShort } from "@/lib/timeline-utils";

export default function ShortsList() {
  const shorts = useEditorStore((s) => s.shorts);
  const activeShortId = useEditorStore((s) => s.activeShortId);
  const selectShort = useEditorStore((s) => s.selectShort);

  if (shorts.length === 0) {
    return (
      <div
        className="p-4 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        No shorts found. Run the Analyze stage to generate edits.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 400px)" }}>
      <div
        className="text-xs font-semibold uppercase tracking-wider px-2 py-1"
        style={{ color: "var(--text-muted)" }}
      >
        Shorts ({shorts.length})
      </div>
      {shorts.map((short) => {
        const duration = totalConcatDuration(short.segmentsToKeep);
        const isActive = short.id === activeShortId;

        return (
          <button
            key={short.id}
            onClick={() => selectShort(short.id)}
            className="w-full text-left rounded-lg px-3 py-2.5 transition-colors"
            style={{
              background: isActive ? "var(--accent-muted)" : "transparent",
              border: isActive
                ? "1px solid var(--accent)"
                : "1px solid transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                #{short.id}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {formatTimeShort(duration)}
              </span>
            </div>
            <div
              className="text-sm mt-0.5 truncate"
              style={{
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              }}
            >
              {short.title}
            </div>
            <div
              className="flex gap-2 mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{short.segmentsToKeep.length} segs</span>
              {short.overlays.length > 0 && (
                <span style={{ color: "var(--broll)" }}>
                  {short.overlays.length} overlays
                </span>
              )}
              {short.sfx.length > 0 && (
                <span style={{ color: "var(--sfx)" }}>
                  {short.sfx.length} sfx
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
