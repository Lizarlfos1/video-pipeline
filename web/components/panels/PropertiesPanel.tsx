"use client";

import { useEditorStore } from "@/lib/store";
import { formatTime, sourceToConcatTime } from "@/lib/timeline-utils";

export default function PropertiesPanel() {
  const shorts = useEditorStore((s) => s.shorts);
  const activeShortId = useEditorStore((s) => s.activeShortId);
  const selectedItems = useEditorStore((s) => s.selectedItems);

  const activeShort = shorts.find((s) => s.id === activeShortId);

  if (!activeShort || selectedItems.length === 0) {
    return (
      <div className="p-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Properties
        </div>
        <div
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Select an item on the timeline
        </div>
      </div>
    );
  }

  const item = selectedItems[0];

  if (item.type === "segment") {
    const seg = activeShort.segmentsToKeep[item.index];
    if (!seg) return null;
    return (
      <div className="p-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          A-Roll Segment
        </div>
        <PropRow label="Index" value={`${item.index + 1} of ${activeShort.segmentsToKeep.length}`} />
        <PropRow label="Source Start" value={formatTime(seg.start)} />
        <PropRow label="Source End" value={formatTime(seg.end)} />
        <PropRow label="Duration" value={`${(seg.end - seg.start).toFixed(2)}s`} />
      </div>
    );
  }

  if (item.type === "overlay") {
    const ov = activeShort.overlays[item.index];
    if (!ov) return null;
    const concatStart = sourceToConcatTime(ov.startAt, activeShort.segmentsToKeep);
    return (
      <div className="p-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          {ov.type === "broll" ? "B-Roll" : "Graph"} Overlay
        </div>
        <PropRow label="Label" value={ov.matchLabel} />
        <PropRow label="Source At" value={formatTime(ov.startAt)} />
        <PropRow label="Timeline At" value={concatStart !== null ? formatTime(concatStart) : "—"} />
        <PropRow label="Duration" value={`${ov.duration.toFixed(2)}s`} />
        {ov.filePath && <PropRow label="File" value={ov.filePath.split("/").pop() || ""} />}
      </div>
    );
  }

  if (item.type === "sfx") {
    const sfx = activeShort.sfx[item.index];
    if (!sfx) return null;
    return (
      <div className="p-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Sound Effect
        </div>
        <PropRow label="Label" value={sfx.matchLabel} />
        <PropRow label="Source At" value={formatTime(sfx.at)} />
      </div>
    );
  }

  return null;
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-xs font-mono"
        style={{ color: "var(--text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}
