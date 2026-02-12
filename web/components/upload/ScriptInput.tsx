"use client";

import { useUploadStore } from "@/lib/upload-store";

export default function ScriptInput() {
  const script = useUploadStore((s) => s.script);
  const setScript = useUploadStore((s) => s.setScript);
  const phase = useUploadStore((s) => s.phase);
  const disabled = phase !== "idle";

  const paragraphs = script
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          Your script
        </label>
        {script.trim().length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {paragraphs} section{paragraphs !== 1 ? "s" : ""} (split by blank lines)
          </span>
        )}
      </div>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        disabled={disabled}
        placeholder={`Paste the script you wrote before recording.\n\nSeparate sections with blank lines — each section becomes a separate short.\n\nExample:\n\nReact hooks allow you to use state and lifecycle features in functional components. The most common hook is useState...\n\nThe useEffect hook lets you perform side effects in your components. It runs after every render by default...`}
        style={{
          width: "100%",
          minHeight: 200,
          maxHeight: 400,
          resize: "vertical",
          fontFamily: "inherit",
          lineHeight: 1.6,
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}
