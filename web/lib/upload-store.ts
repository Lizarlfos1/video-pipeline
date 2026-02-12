"use client";

import { create } from "zustand";
import type { ShortEdit } from "./types";
import * as api from "./api";

type Phase = "idle" | "uploading" | "transcribing" | "aligning" | "done" | "error";

export interface UploadState {
  file: File | null;
  script: string;

  phase: Phase;
  logs: string[];
  errorMessage: string | null;

  runId: string | null;
  shorts: ShortEdit[];

  setFile: (file: File | null) => void;
  setScript: (script: string) => void;
  process: () => Promise<void>;
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set, get) => ({
  file: null,
  script: "",
  phase: "idle",
  logs: [],
  errorMessage: null,
  runId: null,
  shorts: [],

  setFile: (file) => set({ file }),
  setScript: (script) => set({ script }),

  reset: () =>
    set({
      file: null,
      script: "",
      phase: "idle",
      logs: [],
      errorMessage: null,
      runId: null,
      shorts: [],
    }),

  process: async () => {
    const { file, script } = get();
    if (!file || !script.trim()) return;

    try {
      // Step 1: Upload
      set({ phase: "uploading", logs: ["Uploading video..."], errorMessage: null });
      const { runId } = await api.uploadVideo(file, script);
      set((s) => ({
        runId,
        logs: [...s.logs, `Upload complete. Run: ${runId}`],
      }));

      // Step 2: Transcribe
      set((s) => ({
        phase: "transcribing",
        logs: [...s.logs, "Starting transcription (whisper.cpp)..."],
      }));
      await runStage("transcribe", runId, set);

      // Step 3: Align
      set((s) => ({
        phase: "aligning",
        logs: [...s.logs, "Aligning script to transcript..."],
      }));
      await runStage("align", runId, set);

      // Step 4: Load results
      const shorts = await api.getEdits(runId);
      set((s) => ({
        phase: "done",
        shorts,
        logs: [...s.logs, `Done! ${shorts.length} short(s) generated.`],
      }));
    } catch (err: any) {
      set((s) => ({
        phase: "error",
        errorMessage: err.message || "Processing failed",
        logs: [...s.logs, `Error: ${err.message}`],
      }));
    }
  },
}));

/** Run a pipeline stage and wait for completion via SSE */
function runStage(
  stage: "transcribe" | "align",
  runId: string,
  set: (fn: (s: UploadState) => Partial<UploadState>) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { jobId } = await api.triggerPipeline(stage, { runId });

      const eventSource = new EventSource(api.pipelineStreamUrl(stage, jobId));

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "log") {
            set((s) => ({ logs: [...s.logs, data.data] }));
          } else if (data.type === "done") {
            eventSource.close();
            resolve();
          } else if (data.type === "error") {
            eventSource.close();
            reject(new Error(`${stage} failed`));
          }
        } catch {
          set((s) => ({ logs: [...s.logs, event.data] }));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error(`${stage} stream error`));
      };
    } catch (err) {
      reject(err);
    }
  });
}
