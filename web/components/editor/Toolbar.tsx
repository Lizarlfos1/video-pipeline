"use client";

import { useEditorStore } from "@/lib/store";
import { formatTime } from "@/lib/timeline-utils";

export default function Toolbar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const cursorTime = useEditorStore((s) => s.cursorTime);
  const duration = useEditorStore((s) => s.duration);
  const isDirty = useEditorStore((s) => s.isDirty);
  const saveEdits = useEditorStore((s) => s.saveEdits);
  const triggerStage = useEditorStore((s) => s.triggerStage);
  const activeShortId = useEditorStore((s) => s.activeShortId);

  const tools: {
    key: typeof activeTool;
    label: string;
    shortcut: string;
    icon: string;
  }[] = [
    { key: "select", label: "Select", shortcut: "V", icon: "↖" },
    { key: "cut", label: "Cut", shortcut: "C", icon: "✂" },
    { key: "trim", label: "Trim", shortcut: "T", icon: "⇔" },
  ];

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 border-t"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      {/* Tool buttons */}
      <div className="flex gap-1">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-sm transition-colors"
            title={`${tool.label} (${tool.shortcut})`}
            style={{
              background:
                activeTool === tool.key
                  ? "var(--accent-muted)"
                  : "transparent",
              color:
                activeTool === tool.key
                  ? "var(--accent)"
                  : "var(--text-secondary)",
              border:
                activeTool === tool.key
                  ? "1px solid var(--accent)"
                  : "1px solid transparent",
            }}
          >
            <span>{tool.icon}</span>
            <span className="text-xs">{tool.label}</span>
          </button>
        ))}
      </div>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "var(--border)" }}
      />

      {/* Zoom */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setZoom(zoom * 0.8)}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            color: "var(--text-secondary)",
            background: "var(--bg-tertiary)",
          }}
        >
          −
        </button>
        <input
          type="range"
          min={10}
          max={500}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20 h-1 accent-indigo-500"
          style={{ accentColor: "var(--accent)" }}
        />
        <button
          onClick={() => setZoom(zoom * 1.2)}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            color: "var(--text-secondary)",
            background: "var(--bg-tertiary)",
          }}
        >
          +
        </button>
        <span
          className="text-xs font-mono w-12"
          style={{ color: "var(--text-muted)" }}
        >
          {Math.round(zoom)}px/s
        </span>
      </div>

      <div className="flex-1" />

      {/* Time display */}
      <span
        className="font-mono text-sm tabular-nums"
        style={{ color: "var(--text-secondary)" }}
      >
        {formatTime(cursorTime)} / {formatTime(duration)}
      </span>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "var(--border)" }}
      />

      {/* Undo/Redo */}
      <button
        onClick={() => useEditorStore.temporal.getState().undo()}
        className="px-2 py-1 rounded text-xs"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-tertiary)",
        }}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        onClick={() => useEditorStore.temporal.getState().redo()}
        className="px-2 py-1 rounded text-xs"
        style={{
          color: "var(--text-secondary)",
          background: "var(--bg-tertiary)",
        }}
        title="Redo (Ctrl+Shift+Z)"
      >
        Redo
      </button>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "var(--border)" }}
      />

      {/* Save */}
      <button
        onClick={() => saveEdits()}
        className="px-3 py-1 rounded text-xs font-medium transition-colors"
        style={{
          background: isDirty ? "var(--accent)" : "var(--bg-tertiary)",
          color: isDirty ? "#fff" : "var(--text-secondary)",
        }}
        title="Save (Ctrl+S)"
      >
        {isDirty ? "Save*" : "Saved"}
      </button>

      {/* Re-render */}
      {activeShortId !== null && (
        <button
          onClick={async () => {
            await saveEdits();
            await triggerStage("edit");
          }}
          className="px-3 py-1 rounded text-xs font-medium"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
          title="Re-render current short"
        >
          Re-render
        </button>
      )}
    </div>
  );
}
