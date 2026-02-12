"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type MouseEvent,
} from "react";
import { useEditorStore } from "@/lib/store";
import {
  sourceToConcatTime,
  concatToSourceTime,
  totalConcatDuration,
  timeToPixel,
  pixelToTime,
  formatTimeShort,
  formatTime,
} from "@/lib/timeline-utils";
import type {
  ShortEdit,
  KeepSegment,
  Overlay,
  SFXCue,
  WordTimestamp,
  SelectedItem,
  TrackConfig,
  DEFAULT_TRACKS,
} from "@/lib/types";

// Track config
const TRACKS: TrackConfig[] = [
  { id: "aroll", type: "aroll", label: "A-Roll", height: 72, color: "#3b82f6" },
  { id: "overlay", type: "overlay", label: "Overlays", height: 56, color: "#6366f1" },
  { id: "subtitle", type: "subtitle", label: "Subtitles", height: 44, color: "#a855f7" },
  { id: "sfx", type: "sfx", label: "SFX", height: 36, color: "#f59e0b" },
];

const RULER_HEIGHT = 28;
const TRACK_GAP = 2;
const LABEL_WIDTH = 72;

interface DragState {
  mode: "idle" | "dragging" | "trimming" | "scrubbing";
  item?: SelectedItem;
  edge?: "left" | "right";
  startX?: number;
  startTime?: number;
  originalValue?: number;
}

export default function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({ mode: "idle" });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const shorts = useEditorStore((s) => s.shorts);
  const activeShortId = useEditorStore((s) => s.activeShortId);
  const zoom = useEditorStore((s) => s.zoom);
  const scrollX = useEditorStore((s) => s.scrollX);
  const cursorTime = useEditorStore((s) => s.cursorTime);
  const duration = useEditorStore((s) => s.duration);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedItems = useEditorStore((s) => s.selectedItems);
  const setCursorTime = useEditorStore((s) => s.setCursorTime);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setScrollX = useEditorStore((s) => s.setScrollX);
  const setSelectedItems = useEditorStore((s) => s.setSelectedItems);
  const splitSegment = useEditorStore((s) => s.splitSegment);
  const moveOverlay = useEditorStore((s) => s.moveOverlay);
  const resizeOverlay = useEditorStore((s) => s.resizeOverlay);
  const moveSfx = useEditorStore((s) => s.moveSfx);
  const trimSegment = useEditorStore((s) => s.trimSegment);
  const deleteSegment = useEditorStore((s) => s.deleteSegment);
  const deleteOverlay = useEditorStore((s) => s.deleteOverlay);
  const deleteSfx = useEditorStore((s) => s.deleteSfx);

  const activeShort = shorts.find((s) => s.id === activeShortId);

  // Compute total height
  const totalTrackHeight = TRACKS.reduce(
    (sum, t) => sum + t.height + TRACK_GAP,
    0
  );
  const canvasHeight = RULER_HEIGHT + totalTrackHeight + 8;

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setCanvasSize({ width, height: canvasHeight });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasHeight]);

  // Helper: get Y offset for a track
  const getTrackY = useCallback(
    (trackIndex: number): number => {
      let y = RULER_HEIGHT;
      for (let i = 0; i < trackIndex; i++) {
        y += TRACKS[i].height + TRACK_GAP;
      }
      return y;
    },
    []
  );

  // Helper: find which track a Y coordinate falls in
  const getTrackAtY = useCallback(
    (y: number): number => {
      let currentY = RULER_HEIGHT;
      for (let i = 0; i < TRACKS.length; i++) {
        if (y >= currentY && y < currentY + TRACKS[i].height) return i;
        currentY += TRACKS[i].height + TRACK_GAP;
      }
      return -1;
    },
    []
  );

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeShort) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    const w = canvasSize.width;
    const h = canvasSize.height;

    // Clear
    ctx.fillStyle = "#0f0f17";
    ctx.fillRect(0, 0, w, h);

    const txp = (time: number) => timeToPixel(time, zoom, scrollX) + LABEL_WIDTH;

    // --- Ruler ---
    ctx.fillStyle = "#151520";
    ctx.fillRect(0, 0, w, RULER_HEIGHT);
    ctx.strokeStyle = "#2a2a3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, RULER_HEIGHT);
    ctx.lineTo(w, RULER_HEIGHT);
    ctx.stroke();

    // Time ticks
    const tickInterval = getTickInterval(zoom);
    const startTime = Math.floor(pixelToTime(-LABEL_WIDTH + scrollX, zoom, 0) / tickInterval) * tickInterval;
    const endTime = pixelToTime(w - LABEL_WIDTH + scrollX, zoom, 0);

    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillStyle = "#606078";
    ctx.textAlign = "center";

    for (let t = startTime; t <= endTime; t += tickInterval) {
      if (t < 0) continue;
      const x = txp(t);
      if (x < LABEL_WIDTH || x > w) continue;

      // Major tick
      ctx.strokeStyle = "#2a2a3a";
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT - 8);
      ctx.lineTo(x, RULER_HEIGHT);
      ctx.stroke();

      ctx.fillText(formatTimeShort(t), x, RULER_HEIGHT - 12);

      // Minor ticks
      const minorInterval = tickInterval / 4;
      for (let mt = t + minorInterval; mt < t + tickInterval; mt += minorInterval) {
        const mx = txp(mt);
        if (mx < LABEL_WIDTH || mx > w) continue;
        ctx.strokeStyle = "#1e1e2a";
        ctx.beginPath();
        ctx.moveTo(mx, RULER_HEIGHT - 4);
        ctx.lineTo(mx, RULER_HEIGHT);
        ctx.stroke();
      }
    }

    // --- Track labels ---
    TRACKS.forEach((track, i) => {
      const y = getTrackY(i);
      ctx.fillStyle = "#12121a";
      ctx.fillRect(0, y, LABEL_WIDTH, track.height);
      ctx.strokeStyle = "#2a2a3a";
      ctx.strokeRect(0, y, LABEL_WIDTH, track.height);
      ctx.fillStyle = "#9090a8";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(track.label, 8, y + track.height / 2 + 4);
    });

    // --- Track backgrounds ---
    TRACKS.forEach((track, i) => {
      const y = getTrackY(i);
      ctx.fillStyle = "#0d0d15";
      ctx.fillRect(LABEL_WIDTH, y, w - LABEL_WIDTH, track.height);
    });

    // --- A-Roll segments ---
    const arollY = getTrackY(0);
    const arollH = TRACKS[0].height;
    let concatOffset = 0;

    activeShort.segmentsToKeep.forEach((seg, i) => {
      const segDuration = seg.end - seg.start;
      const x = txp(concatOffset);
      const segW = segDuration * zoom;
      const isSelected = selectedItems.some(
        (s) => s.type === "segment" && s.index === i
      );

      if (x + segW > LABEL_WIDTH && x < w) {
        // Segment body
        const clampX = Math.max(LABEL_WIDTH, x);
        const clampW = Math.min(x + segW, w) - clampX;

        ctx.fillStyle = isSelected
          ? "rgba(59, 130, 246, 0.45)"
          : "rgba(59, 130, 246, 0.25)";
        ctx.fillRect(clampX, arollY + 2, clampW, arollH - 4);

        // Border
        ctx.strokeStyle = isSelected ? "#60a5fa" : "#3b82f6";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(clampX, arollY + 2, clampW, arollH - 4);

        // Label
        if (segW > 40) {
          ctx.fillStyle = "#93bbfc";
          ctx.font = "10px -apple-system, sans-serif";
          ctx.textAlign = "left";
          const labelX = Math.max(clampX + 6, LABEL_WIDTH + 6);
          ctx.fillText(
            `${formatTimeShort(seg.start)}–${formatTimeShort(seg.end)}`,
            labelX,
            arollY + 16
          );
        }

        // Trim handles (when selected)
        if (isSelected) {
          // Left handle
          ctx.fillStyle = "#60a5fa";
          ctx.fillRect(clampX, arollY + 2, 4, arollH - 4);
          // Right handle
          ctx.fillRect(clampX + clampW - 4, arollY + 2, 4, arollH - 4);
        }
      }

      // Segment boundary marker
      if (i > 0) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, arollY);
        ctx.lineTo(x, arollY + arollH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      concatOffset += segDuration;
    });

    // --- Overlays ---
    const overlayY = getTrackY(1);
    const overlayH = TRACKS[1].height;

    activeShort.overlays.forEach((overlay, i) => {
      const concatStart = sourceToConcatTime(
        overlay.startAt,
        activeShort.segmentsToKeep
      );
      if (concatStart === null) return;

      const x = txp(concatStart);
      const ovW = overlay.duration * zoom;
      const isSelected = selectedItems.some(
        (s) => s.type === "overlay" && s.index === i
      );

      if (x + ovW > LABEL_WIDTH && x < w) {
        const clampX = Math.max(LABEL_WIDTH, x);
        const clampW = Math.min(x + ovW, w) - clampX;
        const color =
          overlay.type === "broll"
            ? "rgba(99, 102, 241, 0.35)"
            : "rgba(34, 197, 94, 0.35)";
        const borderColor =
          overlay.type === "broll" ? "#818cf8" : "#4ade80";

        ctx.fillStyle = isSelected
          ? overlay.type === "broll"
            ? "rgba(99, 102, 241, 0.55)"
            : "rgba(34, 197, 94, 0.55)"
          : color;
        ctx.fillRect(clampX, overlayY + 2, clampW, overlayH - 4);

        ctx.strokeStyle = isSelected ? "#fff" : borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(clampX, overlayY + 2, clampW, overlayH - 4);

        if (ovW > 30) {
          ctx.fillStyle = "#fff";
          ctx.font = "10px -apple-system, sans-serif";
          ctx.textAlign = "left";
          const labelX = Math.max(clampX + 4, LABEL_WIDTH + 4);
          ctx.fillText(
            overlay.matchLabel,
            labelX,
            overlayY + overlayH / 2 + 3
          );
        }

        // Resize handles
        if (isSelected) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(clampX, overlayY + 2, 3, overlayH - 4);
          ctx.fillRect(clampX + clampW - 3, overlayY + 2, 3, overlayH - 4);
        }
      }
    });

    // --- Subtitles ---
    const subY = getTrackY(2);
    const subH = TRACKS[2].height;
    const WORDS_PER_GROUP = 5;

    if (activeShort.subtitleWords.length > 0) {
      for (
        let gi = 0;
        gi < activeShort.subtitleWords.length;
        gi += WORDS_PER_GROUP
      ) {
        const groupWords = activeShort.subtitleWords.slice(
          gi,
          gi + WORDS_PER_GROUP
        );
        const firstWord = groupWords[0];
        const lastWord = groupWords[groupWords.length - 1];

        const concatStart = sourceToConcatTime(
          firstWord.start,
          activeShort.segmentsToKeep
        );
        const concatEnd = sourceToConcatTime(
          lastWord.end,
          activeShort.segmentsToKeep
        );
        if (concatStart === null || concatEnd === null) continue;

        const x = txp(concatStart);
        const subW = (concatEnd - concatStart) * zoom;
        const isSelected = selectedItems.some(
          (s) => s.type === "subtitle" && s.index === gi
        );

        if (x + subW > LABEL_WIDTH && x < w && subW > 2) {
          const clampX = Math.max(LABEL_WIDTH, x);
          const clampW = Math.min(x + subW, w) - clampX;

          ctx.fillStyle = isSelected
            ? "rgba(168, 85, 247, 0.45)"
            : "rgba(168, 85, 247, 0.2)";
          ctx.fillRect(clampX, subY + 2, clampW, subH - 4);

          ctx.strokeStyle = isSelected ? "#c084fc" : "rgba(168, 85, 247, 0.4)";
          ctx.lineWidth = 1;
          ctx.strokeRect(clampX, subY + 2, clampW, subH - 4);

          if (subW > 20) {
            ctx.fillStyle = "#d8b4fe";
            ctx.font = "9px -apple-system, sans-serif";
            ctx.textAlign = "left";
            const text = groupWords.map((w) => w.word).join(" ");
            const labelX = Math.max(clampX + 3, LABEL_WIDTH + 3);
            ctx.fillText(text, labelX, subY + subH / 2 + 3, clampW - 6);
          }
        }
      }
    }

    // --- SFX ---
    const sfxY = getTrackY(3);
    const sfxH = TRACKS[3].height;

    activeShort.sfx.forEach((sfx, i) => {
      const concatStart = sourceToConcatTime(
        sfx.at,
        activeShort.segmentsToKeep
      );
      if (concatStart === null) return;

      const x = txp(concatStart);
      const isSelected = selectedItems.some(
        (s) => s.type === "sfx" && s.index === i
      );

      if (x > LABEL_WIDTH && x < w) {
        // Diamond marker
        ctx.fillStyle = isSelected
          ? "rgba(245, 158, 11, 0.8)"
          : "rgba(245, 158, 11, 0.5)";
        ctx.beginPath();
        const size = 8;
        ctx.moveTo(x, sfxY + sfxH / 2 - size);
        ctx.lineTo(x + size, sfxY + sfxH / 2);
        ctx.moveTo(x, sfxY + sfxH / 2 + size);
        ctx.lineTo(x - size, sfxY + sfxH / 2);
        ctx.closePath();
        ctx.fill();

        // Vertical line
        ctx.strokeStyle = isSelected
          ? "rgba(245, 158, 11, 0.8)"
          : "rgba(245, 158, 11, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, sfxY);
        ctx.lineTo(x, sfxY + sfxH);
        ctx.stroke();

        // Label
        ctx.fillStyle = "#fbbf24";
        ctx.font = "9px -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(sfx.matchLabel, x + 6, sfxY + 12);
      }
    });

    // --- Emphasis word markers on a-roll track ---
    activeShort.emphasisWords.forEach((ew) => {
      const concatT = sourceToConcatTime(
        ew.timestamp,
        activeShort.segmentsToKeep
      );
      if (concatT === null) return;
      const x = txp(concatT);
      if (x < LABEL_WIDTH || x > w) return;

      // Small triangle above a-roll
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.moveTo(x - 4, arollY + arollH - 2);
      ctx.lineTo(x + 4, arollY + arollH - 2);
      ctx.lineTo(x, arollY + arollH - 10);
      ctx.closePath();
      ctx.fill();
    });

    // --- Playhead ---
    const playheadX = txp(cursorTime);
    if (playheadX >= LABEL_WIDTH && playheadX <= w) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      // Playhead triangle
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }

    // --- Cut tool cursor line ---
    if (activeTool === "cut" && dragState.mode === "idle") {
      // Will be rendered on mousemove via separate state
    }
  }, [
    canvasSize,
    activeShort,
    zoom,
    scrollX,
    cursorTime,
    selectedItems,
    activeTool,
    duration,
    getTrackY,
    dragState,
  ]);

  // Render loop
  useEffect(() => {
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  // Hit test: what's at this position?
  const hitTest = useCallback(
    (
      canvasX: number,
      canvasY: number
    ): { item: SelectedItem; edge?: "left" | "right" } | null => {
      if (!activeShort) return null;

      const time = pixelToTime(canvasX - LABEL_WIDTH + scrollX, zoom, 0);
      const trackIdx = getTrackAtY(canvasY);

      if (trackIdx === 0) {
        // A-Roll segments
        let concatOffset = 0;
        for (let i = 0; i < activeShort.segmentsToKeep.length; i++) {
          const seg = activeShort.segmentsToKeep[i];
          const segDur = seg.end - seg.start;
          if (time >= concatOffset && time <= concatOffset + segDur) {
            // Check trim edges (8px threshold)
            const leftEdgeTime = concatOffset;
            const rightEdgeTime = concatOffset + segDur;
            const threshold = 8 / zoom; // pixels to time

            if (Math.abs(time - leftEdgeTime) < threshold) {
              return { item: { type: "segment", index: i }, edge: "left" };
            }
            if (Math.abs(time - rightEdgeTime) < threshold) {
              return { item: { type: "segment", index: i }, edge: "right" };
            }
            return { item: { type: "segment", index: i } };
          }
          concatOffset += segDur;
        }
      } else if (trackIdx === 1) {
        // Overlays
        for (let i = 0; i < activeShort.overlays.length; i++) {
          const ov = activeShort.overlays[i];
          const concatStart = sourceToConcatTime(
            ov.startAt,
            activeShort.segmentsToKeep
          );
          if (concatStart === null) continue;
          if (time >= concatStart && time <= concatStart + ov.duration) {
            const threshold = 8 / zoom;
            if (Math.abs(time - concatStart) < threshold) {
              return { item: { type: "overlay", index: i }, edge: "left" };
            }
            if (Math.abs(time - (concatStart + ov.duration)) < threshold) {
              return { item: { type: "overlay", index: i }, edge: "right" };
            }
            return { item: { type: "overlay", index: i } };
          }
        }
      } else if (trackIdx === 2) {
        // Subtitles
        const WORDS_PER_GROUP = 5;
        for (
          let gi = 0;
          gi < activeShort.subtitleWords.length;
          gi += WORDS_PER_GROUP
        ) {
          const group = activeShort.subtitleWords.slice(gi, gi + WORDS_PER_GROUP);
          const first = group[0];
          const last = group[group.length - 1];
          const concatStart = sourceToConcatTime(
            first.start,
            activeShort.segmentsToKeep
          );
          const concatEnd = sourceToConcatTime(
            last.end,
            activeShort.segmentsToKeep
          );
          if (concatStart !== null && concatEnd !== null) {
            if (time >= concatStart && time <= concatEnd) {
              return { item: { type: "subtitle", index: gi } };
            }
          }
        }
      } else if (trackIdx === 3) {
        // SFX
        for (let i = 0; i < activeShort.sfx.length; i++) {
          const sfx = activeShort.sfx[i];
          const concatStart = sourceToConcatTime(
            sfx.at,
            activeShort.segmentsToKeep
          );
          if (concatStart !== null && Math.abs(time - concatStart) < 12 / zoom) {
            return { item: { type: "sfx", index: i } };
          }
        }
      }

      return null;
    },
    [activeShort, zoom, scrollX, getTrackAtY]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!activeShort) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const time = pixelToTime(x - LABEL_WIDTH + scrollX, zoom, 0);

      // Ruler click = scrub
      if (y < RULER_HEIGHT) {
        setCursorTime(Math.max(0, Math.min(duration, time)));
        setDragState({ mode: "scrubbing" });
        return;
      }

      // Cut tool
      if (activeTool === "cut") {
        const hit = hitTest(x, y);
        if (hit && hit.item.type === "segment") {
          const sourceTime = concatToSourceTime(
            time,
            activeShort.segmentsToKeep
          );
          splitSegment(hit.item.index, sourceTime);
        }
        return;
      }

      // Select tool
      const hit = hitTest(x, y);
      if (hit) {
        setSelectedItems([hit.item]);

        if (hit.edge) {
          // Start trimming
          setDragState({
            mode: "trimming",
            item: hit.item,
            edge: hit.edge,
            startX: x,
            startTime: time,
          });
        } else {
          // Start dragging
          setDragState({
            mode: "dragging",
            item: hit.item,
            startX: x,
            startTime: time,
            originalValue: getItemTime(hit.item, activeShort),
          });
        }
      } else {
        // Click on empty space = seek
        setSelectedItems([]);
        setCursorTime(Math.max(0, Math.min(duration, time)));
        setDragState({ mode: "scrubbing" });
      }
    },
    [
      activeShort,
      zoom,
      scrollX,
      duration,
      activeTool,
      hitTest,
      setCursorTime,
      setSelectedItems,
      splitSegment,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!activeShort || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = pixelToTime(x - LABEL_WIDTH + scrollX, zoom, 0);

      // Cursor style
      const y = e.clientY - rect.top;
      if (activeTool === "cut") {
        canvasRef.current.style.cursor = "crosshair";
      } else {
        const hit = hitTest(x, y);
        if (hit?.edge) {
          canvasRef.current.style.cursor = "col-resize";
        } else if (hit) {
          canvasRef.current.style.cursor = "grab";
        } else {
          canvasRef.current.style.cursor = "default";
        }
      }

      if (dragState.mode === "scrubbing") {
        setCursorTime(Math.max(0, Math.min(duration, time)));
      } else if (
        dragState.mode === "dragging" &&
        dragState.item &&
        dragState.startTime !== undefined &&
        dragState.originalValue !== undefined
      ) {
        const delta = time - dragState.startTime;
        const newTime = Math.max(0, dragState.originalValue + delta);

        if (dragState.item.type === "overlay") {
          const concatTime = newTime;
          const sourceTime = concatToSourceTime(
            concatTime,
            activeShort.segmentsToKeep
          );
          moveOverlay(dragState.item.index, sourceTime);
        } else if (dragState.item.type === "sfx") {
          const sourceTime = concatToSourceTime(
            newTime,
            activeShort.segmentsToKeep
          );
          moveSfx(dragState.item.index, sourceTime);
        }
      } else if (
        dragState.mode === "trimming" &&
        dragState.item &&
        dragState.edge
      ) {
        if (dragState.item.type === "segment") {
          const sourceTime = concatToSourceTime(
            time,
            activeShort.segmentsToKeep
          );
          trimSegment(dragState.item.index, dragState.edge, sourceTime);
        } else if (dragState.item.type === "overlay") {
          const ov = activeShort.overlays[dragState.item.index];
          const concatStart = sourceToConcatTime(
            ov.startAt,
            activeShort.segmentsToKeep
          );
          if (concatStart === null) return;

          if (dragState.edge === "left") {
            const newConcatStart = Math.max(0, time);
            const newDuration = concatStart + ov.duration - newConcatStart;
            const newSourceStart = concatToSourceTime(
              newConcatStart,
              activeShort.segmentsToKeep
            );
            resizeOverlay(dragState.item.index, newSourceStart, newDuration);
          } else {
            const newDuration = Math.max(0.5, time - concatStart);
            resizeOverlay(dragState.item.index, ov.startAt, newDuration);
          }
        }
      }
    },
    [
      activeShort,
      zoom,
      scrollX,
      duration,
      activeTool,
      dragState,
      hitTest,
      setCursorTime,
      moveOverlay,
      moveSfx,
      trimSegment,
      resizeOverlay,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDragState({ mode: "idle" });
  }, []);

  // Wheel: zoom/scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      } else {
        setScrollX(scrollX + e.deltaX + e.deltaY);
      }
    },
    [zoom, scrollX, setZoom, setScrollX]
  );

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selectedItems.length > 0) {
            e.preventDefault();
            const item = selectedItems[0];
            if (item.type === "segment") deleteSegment(item.index);
            else if (item.type === "overlay") deleteOverlay(item.index);
            else if (item.type === "sfx") deleteSfx(item.index);
          }
          break;
        case " ":
          e.preventDefault();
          useEditorStore.getState().togglePlay();
          break;
        case "v":
        case "V":
          useEditorStore.getState().setActiveTool("select");
          break;
        case "c":
        case "C":
          if (!e.ctrlKey && !e.metaKey) {
            useEditorStore.getState().setActiveTool("cut");
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCursorTime(
            Math.max(0, cursorTime - (e.shiftKey ? 1 : 1 / 30))
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          setCursorTime(
            Math.min(duration, cursorTime + (e.shiftKey ? 1 : 1 / 30))
          );
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            useEditorStore.getState().saveEdits();
          }
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              useEditorStore.temporal.getState().redo();
            } else {
              useEditorStore.temporal.getState().undo();
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedItems,
    cursorTime,
    duration,
    setCursorTime,
    deleteSegment,
    deleteOverlay,
    deleteSfx,
  ]);

  // Drop handler for assets
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!activeShort) return;

      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const concatTime = pixelToTime(x - LABEL_WIDTH + scrollX, zoom, 0);
        const sourceTime = concatToSourceTime(
          concatTime,
          activeShort.segmentsToKeep
        );

        if (data.type === "broll" || data.type === "graph") {
          useEditorStore.getState().addOverlay({
            type: data.type,
            matchLabel: data.label,
            filePath: data.path,
            startAt: sourceTime,
            duration: 5, // default 5 seconds
          });
        } else if (data.type === "sfx") {
          useEditorStore.getState().addSfx({
            matchLabel: data.label,
            filePath: data.path,
            at: sourceTime,
          });
        }
      } catch {
        // Invalid drop data
      }
    },
    [activeShort, zoom, scrollX]
  );

  if (!activeShort) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-full"
        style={{ background: "#0f0f17", color: "var(--text-muted)" }}
      >
        <span className="text-sm">Select a short to view the timeline</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden relative"
      style={{ background: "#0f0f17" }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          display: "block",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      />
    </div>
  );
}

// Helpers

function getTickInterval(zoom: number): number {
  const targetPixels = 80;
  const rawInterval = targetPixels / zoom;

  const intervals = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  for (const interval of intervals) {
    if (interval >= rawInterval) return interval;
  }
  return 600;
}

function getItemTime(
  item: SelectedItem,
  short: ShortEdit
): number {
  if (item.type === "overlay") {
    const ov = short.overlays[item.index];
    const ct = sourceToConcatTime(ov.startAt, short.segmentsToKeep);
    return ct ?? 0;
  }
  if (item.type === "sfx") {
    const sfx = short.sfx[item.index];
    const ct = sourceToConcatTime(sfx.at, short.segmentsToKeep);
    return ct ?? 0;
  }
  return 0;
}
