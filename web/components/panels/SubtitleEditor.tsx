"use client";

import { useEditorStore } from "@/lib/store";
import { formatTime } from "@/lib/timeline-utils";

export default function SubtitleEditor() {
  const shorts = useEditorStore((s) => s.shorts);
  const activeShortId = useEditorStore((s) => s.activeShortId);
  const selectedItems = useEditorStore((s) => s.selectedItems);
  const updateSubtitleWord = useEditorStore((s) => s.updateSubtitleWord);

  const activeShort = shorts.find((s) => s.id === activeShortId);
  const subtitleSelection = selectedItems.find((s) => s.type === "subtitle");

  if (!activeShort || !subtitleSelection) return null;

  const WORDS_PER_GROUP = 5;
  const startIdx = subtitleSelection.index;
  const groupWords = activeShort.subtitleWords.slice(
    startIdx,
    startIdx + WORDS_PER_GROUP
  );

  return (
    <div
      className="border-t p-3"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        Subtitle Editor
      </div>

      <div className="flex flex-col gap-1.5">
        {groupWords.map((word, i) => (
          <div
            key={startIdx + i}
            className="flex items-center gap-2"
          >
            <span
              className="text-xs font-mono w-16 text-right flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {formatTime(word.start)}
            </span>
            <input
              type="text"
              value={word.word}
              onChange={(e) =>
                updateSubtitleWord(startIdx + i, e.target.value)
              }
              className="flex-1 text-sm px-2 py-1 rounded"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <span
              className="text-xs font-mono w-16 flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {formatTime(word.end)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
