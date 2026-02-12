"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import type {
  Transcript,
  AssetIndex,
  ShortEdit,
  KeepSegment,
  Overlay,
  SFXCue,
  PipelineStage,
  StageStatus,
  TimelineTool,
  SelectedItem,
  RunInfo,
} from "./types";
import * as api from "./api";
import { totalConcatDuration, sourceToConcatTime } from "./timeline-utils";

export interface EditorState {
  // Run
  runs: RunInfo[];
  currentRunId: string | null;

  // Data
  transcript: Transcript | null;
  assets: AssetIndex | null;
  shorts: ShortEdit[];

  // Active short
  activeShortId: number | null;

  // Timeline
  zoom: number; // pixels per second
  scrollX: number;
  cursorTime: number; // concat time
  isPlaying: boolean;
  activeTool: TimelineTool;
  selectedItems: SelectedItem[];
  duration: number; // total concat duration of active short

  // Pipeline
  pipelineStatus: Record<PipelineStage, StageStatus>;
  pipelineLogs: string[];
  activeJob: { stage: PipelineStage; jobId: string } | null;

  // Dirty
  isDirty: boolean;

  // Actions
  fetchRuns: () => Promise<void>;
  loadRun: (runId: string) => Promise<void>;
  selectShort: (shortId: number) => void;

  // Timeline actions
  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  setCursorTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setActiveTool: (tool: TimelineTool) => void;
  setSelectedItems: (items: SelectedItem[]) => void;
  clearSelection: () => void;

  // Edit actions
  updateShort: (shortId: number, updates: Partial<ShortEdit>) => void;
  splitSegment: (segmentIndex: number, sourceTime: number) => void;
  deleteSegment: (segmentIndex: number) => void;
  moveOverlay: (overlayIndex: number, newStartAt: number) => void;
  resizeOverlay: (
    overlayIndex: number,
    newStartAt: number,
    newDuration: number
  ) => void;
  addOverlay: (overlay: Overlay) => void;
  deleteOverlay: (overlayIndex: number) => void;
  moveSfx: (sfxIndex: number, newAt: number) => void;
  addSfx: (sfx: SFXCue) => void;
  deleteSfx: (sfxIndex: number) => void;
  trimSegment: (
    segmentIndex: number,
    edge: "left" | "right",
    newTime: number
  ) => void;
  updateSubtitleWord: (wordIndex: number, newWord: string) => void;

  // Persistence
  saveEdits: () => Promise<void>;

  // Pipeline
  triggerStage: (
    stage: PipelineStage,
    extra?: Record<string, unknown>
  ) => Promise<void>;
}

function getActiveShort(
  shorts: ShortEdit[],
  id: number | null
): ShortEdit | undefined {
  if (id === null) return undefined;
  return shorts.find((s) => s.id === id);
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      // Initial state
      runs: [],
      currentRunId: null,
      transcript: null,
      assets: null,
      shorts: [],
      activeShortId: null,
      zoom: 80,
      scrollX: 0,
      cursorTime: 0,
      isPlaying: false,
      activeTool: "select",
      selectedItems: [],
      duration: 0,
      pipelineStatus: {
        pull: "idle",
        transcribe: "idle",
        analyze: "idle",
        align: "idle",
        edit: "idle",
        subtitles: "idle",
      },
      pipelineLogs: [],
      activeJob: null,
      isDirty: false,

      fetchRuns: async () => {
        const runs = await api.listRuns();
        set({ runs });
      },

      loadRun: async (runId: string) => {
        set({ currentRunId: runId, shorts: [], activeShortId: null });
        try {
          const [transcript, assets, edits] = await Promise.allSettled([
            api.getTranscript(runId),
            api.getAssets(runId),
            api.getEdits(runId),
          ]);
          set({
            transcript:
              transcript.status === "fulfilled" ? transcript.value : null,
            assets: assets.status === "fulfilled" ? assets.value : null,
            shorts: edits.status === "fulfilled" ? edits.value : [],
          });
          // Auto-select first short
          const shorts =
            edits.status === "fulfilled" ? edits.value : [];
          if (shorts.length > 0) {
            get().selectShort(shorts[0].id);
          }
        } catch (e) {
          console.error("Failed to load run:", e);
        }
      },

      selectShort: (shortId: number) => {
        const short = getActiveShort(get().shorts, shortId);
        set({
          activeShortId: shortId,
          cursorTime: 0,
          scrollX: 0,
          selectedItems: [],
          duration: short ? totalConcatDuration(short.segmentsToKeep) : 0,
        });
      },

      setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
      setScrollX: (scrollX) => set({ scrollX: Math.max(0, scrollX) }),
      setCursorTime: (cursorTime) => set({ cursorTime: Math.max(0, cursorTime) }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setActiveTool: (activeTool) => set({ activeTool }),
      setSelectedItems: (selectedItems) => set({ selectedItems }),
      clearSelection: () => set({ selectedItems: [] }),

      updateShort: (shortId, updates) => {
        set((s) => ({
          shorts: s.shorts.map((sh) =>
            sh.id === shortId ? { ...sh, ...updates } : sh
          ),
          isDirty: true,
        }));
      },

      splitSegment: (segmentIndex, sourceTime) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const seg = short.segmentsToKeep[segmentIndex];
        if (!seg || sourceTime <= seg.start || sourceTime >= seg.end) return;

        const newSegments = [...short.segmentsToKeep];
        newSegments.splice(segmentIndex, 1, {
          start: seg.start,
          end: sourceTime,
        }, {
          start: sourceTime,
          end: seg.end,
        });

        get().updateShort(short.id, { segmentsToKeep: newSegments });
      },

      deleteSegment: (segmentIndex) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short || short.segmentsToKeep.length <= 1) return;

        const newSegments = short.segmentsToKeep.filter(
          (_, i) => i !== segmentIndex
        );
        get().updateShort(short.id, { segmentsToKeep: newSegments });
        set({
          duration: totalConcatDuration(newSegments),
          selectedItems: [],
        });
      },

      moveOverlay: (overlayIndex, newStartAt) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const newOverlays = [...short.overlays];
        newOverlays[overlayIndex] = {
          ...newOverlays[overlayIndex],
          startAt: newStartAt,
        };
        get().updateShort(short.id, { overlays: newOverlays });
      },

      resizeOverlay: (overlayIndex, newStartAt, newDuration) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const newOverlays = [...short.overlays];
        newOverlays[overlayIndex] = {
          ...newOverlays[overlayIndex],
          startAt: newStartAt,
          duration: Math.max(0.5, newDuration),
        };
        get().updateShort(short.id, { overlays: newOverlays });
      },

      addOverlay: (overlay) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        get().updateShort(short.id, {
          overlays: [...short.overlays, overlay],
        });
      },

      deleteOverlay: (overlayIndex) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        get().updateShort(short.id, {
          overlays: short.overlays.filter((_, i) => i !== overlayIndex),
        });
        set({ selectedItems: [] });
      },

      moveSfx: (sfxIndex, newAt) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const newSfx = [...short.sfx];
        newSfx[sfxIndex] = { ...newSfx[sfxIndex], at: newAt };
        get().updateShort(short.id, { sfx: newSfx });
      },

      addSfx: (sfx) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        get().updateShort(short.id, { sfx: [...short.sfx, sfx] });
      },

      deleteSfx: (sfxIndex) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        get().updateShort(short.id, {
          sfx: short.sfx.filter((_, i) => i !== sfxIndex),
        });
        set({ selectedItems: [] });
      },

      trimSegment: (segmentIndex, edge, newTime) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const seg = short.segmentsToKeep[segmentIndex];
        if (!seg) return;

        const newSegments = [...short.segmentsToKeep];
        if (edge === "left") {
          newSegments[segmentIndex] = {
            start: Math.min(newTime, seg.end - 0.1),
            end: seg.end,
          };
        } else {
          newSegments[segmentIndex] = {
            start: seg.start,
            end: Math.max(newTime, seg.start + 0.1),
          };
        }

        get().updateShort(short.id, { segmentsToKeep: newSegments });
        set({ duration: totalConcatDuration(newSegments) });
      },

      updateSubtitleWord: (wordIndex, newWord) => {
        const { activeShortId, shorts } = get();
        const short = getActiveShort(shorts, activeShortId);
        if (!short) return;
        const newWords = [...short.subtitleWords];
        newWords[wordIndex] = { ...newWords[wordIndex], word: newWord };
        get().updateShort(short.id, { subtitleWords: newWords });
      },

      saveEdits: async () => {
        const { currentRunId, shorts } = get();
        if (!currentRunId) return;
        await api.saveEdits(currentRunId, shorts);
        set({ isDirty: false });
      },

      triggerStage: async (stage, extra = {}) => {
        const { currentRunId, activeShortId } = get();
        if (!currentRunId) return;

        set((s) => ({
          pipelineStatus: { ...s.pipelineStatus, [stage]: "running" },
          pipelineLogs: [],
        }));

        try {
          const body: Record<string, unknown> = {
            runId: currentRunId,
            ...extra,
          };
          if (
            (stage === "edit" || stage === "subtitles") &&
            activeShortId !== null
          ) {
            body.shortId = activeShortId;
          }

          const { jobId } = await api.triggerPipeline(stage, body);
          set({ activeJob: { stage, jobId } });

          // Open SSE stream
          const eventSource = new EventSource(
            api.pipelineStreamUrl(stage, jobId)
          );

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "log") {
                set((s) => ({
                  pipelineLogs: [...s.pipelineLogs, data.data],
                }));
              } else if (data.type === "done") {
                set((s) => ({
                  pipelineStatus: {
                    ...s.pipelineStatus,
                    [stage]: "success",
                  },
                  activeJob: null,
                }));
                eventSource.close();
                // Reload data after successful stage
                if (stage === "analyze") {
                  get().loadRun(currentRunId);
                }
              } else if (data.type === "error") {
                set((s) => ({
                  pipelineStatus: {
                    ...s.pipelineStatus,
                    [stage]: "error",
                  },
                  activeJob: null,
                }));
                eventSource.close();
              }
            } catch {
              // Non-JSON message, treat as log
              set((s) => ({
                pipelineLogs: [...s.pipelineLogs, event.data],
              }));
            }
          };

          eventSource.onerror = () => {
            set((s) => ({
              pipelineStatus: { ...s.pipelineStatus, [stage]: "error" },
              activeJob: null,
            }));
            eventSource.close();
          };
        } catch (e) {
          console.error("Pipeline trigger failed:", e);
          set((s) => ({
            pipelineStatus: { ...s.pipelineStatus, [stage]: "error" },
            activeJob: null,
          }));
        }
      },
    }),
    {
      partialize: (state) => ({
        shorts: state.shorts,
      }),
      limit: 50,
    }
  )
);
