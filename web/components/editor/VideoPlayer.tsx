"use client";

import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@/lib/store";
import { mediaUrl } from "@/lib/api";
import {
  concatToSourceTime,
  sourceToConcatTime,
  formatTime,
} from "@/lib/timeline-utils";

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number>(0);

  const currentRunId = useEditorStore((s) => s.currentRunId);
  const shorts = useEditorStore((s) => s.shorts);
  const activeShortId = useEditorStore((s) => s.activeShortId);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const cursorTime = useEditorStore((s) => s.cursorTime);
  const duration = useEditorStore((s) => s.duration);
  const setCursorTime = useEditorStore((s) => s.setCursorTime);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);

  const activeShort = shorts.find((s) => s.id === activeShortId);
  const segments = activeShort?.segmentsToKeep ?? [];

  const videoSrc = currentRunId
    ? mediaUrl(`runs/${currentRunId}/a-roll.mp4`)
    : "";

  // Seek video when cursor time changes (from timeline click etc.)
  useEffect(() => {
    if (!videoRef.current || segments.length === 0) return;
    const sourceTime = concatToSourceTime(cursorTime, segments);
    const currentSourceTime = videoRef.current.currentTime;
    if (Math.abs(currentSourceTime - sourceTime) > 0.1) {
      videoRef.current.currentTime = sourceTime;
    }
  }, [cursorTime, segments]);

  // Playback loop: sync video time to store, handle segment jumps
  const playbackLoop = useCallback(() => {
    if (!videoRef.current || segments.length === 0) return;

    const sourceTime = videoRef.current.currentTime;

    // Find which segment we're in
    const currentSegIdx = segments.findIndex(
      (seg) => sourceTime >= seg.start - 0.05 && sourceTime <= seg.end + 0.05
    );

    if (currentSegIdx === -1) {
      // We're in a gap - jump to the nearest next segment
      const nextSeg = segments.find((seg) => seg.start > sourceTime);
      if (nextSeg) {
        videoRef.current.currentTime = nextSeg.start;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        return;
      }
    } else if (sourceTime >= segments[currentSegIdx].end - 0.03) {
      // End of current segment - jump to next or stop
      if (currentSegIdx < segments.length - 1) {
        videoRef.current.currentTime = segments[currentSegIdx + 1].start;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        return;
      }
    }

    // Update cursor time from video position
    const concatTime = sourceToConcatTime(
      videoRef.current.currentTime,
      segments
    );
    if (concatTime !== null) {
      setCursorTime(concatTime);
    }

    animRef.current = requestAnimationFrame(playbackLoop);
  }, [segments, setCursorTime, setIsPlaying]);

  // Start/stop playback
  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      const sourceTime = concatToSourceTime(cursorTime, segments);
      videoRef.current.currentTime = sourceTime;
      videoRef.current.play().catch(() => setIsPlaying(false));
      animRef.current = requestAnimationFrame(playbackLoop);
    } else {
      videoRef.current.pause();
      cancelAnimationFrame(animRef.current);
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  const handleFrameStep = useCallback(
    (direction: 1 | -1) => {
      const frameTime = 1 / 30;
      const newTime = Math.max(
        0,
        Math.min(duration, cursorTime + direction * frameTime)
      );
      setCursorTime(newTime);
    },
    [cursorTime, duration, setCursorTime]
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Video container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-h-full max-w-full object-contain"
            style={{ borderRadius: 4 }}
            preload="auto"
          />
        ) : (
          <div
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Select a run to load video
          </div>
        )}
      </div>

      {/* Transport controls */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-t"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Frame back */}
        <button
          onClick={() => handleFrameStep(-1)}
          className="p-1.5 rounded hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          title="Previous frame (←)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => useEditorStore.getState().togglePlay()}
          className="p-2 rounded-full"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Frame forward */}
        <button
          onClick={() => handleFrameStep(1)}
          className="p-1.5 rounded hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          title="Next frame (→)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Time display */}
        <div className="flex-1" />
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatTime(cursorTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
