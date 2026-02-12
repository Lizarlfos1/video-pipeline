"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import RunPicker from "@/components/panels/RunPicker";
import ShortsList from "@/components/panels/ShortsList";
import PipelineControls from "@/components/pipeline/PipelineControls";
import VideoPlayer from "@/components/editor/VideoPlayer";
import Toolbar from "@/components/editor/Toolbar";
import Timeline from "@/components/editor/Timeline";
import AssetBrowser from "@/components/panels/AssetBrowser";
import PropertiesPanel from "@/components/panels/PropertiesPanel";
import SubtitleEditor from "@/components/panels/SubtitleEditor";

export default function EditorPage() {
  const isDirty = useEditorStore((s) => s.isDirty);
  const currentRunId = useEditorStore((s) => s.currentRunId);
  const activeShortId = useEditorStore((s) => s.activeShortId);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center px-4 py-1.5 border-b flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Video Pipeline
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            Editor
          </span>
        </div>
        <div className="flex-1 mx-4 max-w-md">
          <RunPicker />
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span
              className="text-xs"
              style={{ color: "var(--warning)" }}
            >
              Unsaved changes
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside
          className="flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{
            width: 240,
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <ShortsList />
          <div
            className="border-t mt-auto"
            style={{ borderColor: "var(--border)" }}
          >
            <PipelineControls />
          </div>
        </aside>

        {/* Center: Video + Timeline */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Video player */}
          <div className="flex-1 min-h-0">
            <VideoPlayer />
          </div>

          {/* Toolbar */}
          <Toolbar />

          {/* Timeline */}
          <div
            className="flex-shrink-0 border-t"
            style={{
              height: 240,
              borderColor: "var(--border)",
            }}
          >
            <Timeline />
          </div>

          {/* Subtitle editor (appears when subtitle selected) */}
          <SubtitleEditor />
        </main>

        {/* Right sidebar */}
        <aside
          className="flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{
            width: 240,
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <div className="flex-1">
            <AssetBrowser />
          </div>
          <div
            className="border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <PropertiesPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
