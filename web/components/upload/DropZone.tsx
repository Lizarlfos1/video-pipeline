"use client";

import { useCallback, useRef, useState } from "react";
import { useUploadStore } from "@/lib/upload-store";

export default function DropZone() {
  const file = useUploadStore((s) => s.file);
  const setFile = useUploadStore((s) => s.setFile);
  const phase = useUploadStore((s) => s.phase);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = phase !== "idle";

  const handleFile = useCallback(
    (f: File | null) => {
      if (disabled) return;
      if (f && !f.type.startsWith("video/")) {
        return; // ignore non-video files
      }
      setFile(f);
    },
    [setFile, disabled],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? "var(--accent)" : file ? "var(--success)" : "var(--border)"}`,
        background: isDragging ? "var(--accent-muted)" : "var(--bg-tertiary)",
        borderRadius: 12,
        padding: "40px 24px",
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {file ? (
        <div>
          <div
            style={{
              fontSize: 32,
              marginBottom: 8,
              filter: "grayscale(1) brightness(1.5)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
            {file.name}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            {formatSize(file.size)}
          </p>
          {!disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              style={{
                marginTop: 12,
                padding: "4px 12px",
                fontSize: 12,
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
                borderRadius: 6,
              }}
            >
              Change file
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
            Drop your a-roll video here
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            or click to browse
          </p>
        </div>
      )}
    </div>
  );
}
