/** Re-export pipeline types + frontend-specific types */

// Pipeline types (mirrored from ../src/types.ts to avoid cross-project import issues)
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  words: WordTimestamp[];
}

export interface Transcript {
  segments: TranscriptSegment[];
  fullText: string;
  duration: number;
}

export interface EmphasisWord {
  word: string;
  timestamp: number;
  duration: number;
}

export interface Overlay {
  type: "broll" | "graph";
  matchLabel: string;
  filePath?: string;
  startAt: number;
  duration: number;
}

export interface SFXCue {
  matchLabel: string;
  filePath?: string;
  at: number;
}

export interface KeepSegment {
  start: number;
  end: number;
}

export interface ShortEdit {
  id: number;
  title: string;
  sourceStart: number;
  sourceEnd: number;
  segmentsToKeep: KeepSegment[];
  emphasisWords: EmphasisWord[];
  overlays: Overlay[];
  sfx: SFXCue[];
  subtitleWords: WordTimestamp[];
}

export interface AssetIndex {
  broll: { label: string; path: string }[];
  graphs: { label: string; path: string }[];
  sfx: { label: string; path: string }[];
}

// Frontend-specific types
export interface RunInfo {
  id: string;
  created: string;
  hasARoll: boolean;
  hasTranscript: boolean;
  hasEdits: boolean;
  hasAssets: boolean;
  hasScript: boolean;
  shortsCount: number;
  finalsCount: number;
}

export type PipelineStage = "pull" | "transcribe" | "analyze" | "align" | "edit" | "subtitles";

export type StageStatus = "idle" | "running" | "success" | "error";

export type TimelineTool = "select" | "cut" | "trim";

export interface SelectedItem {
  type: "segment" | "overlay" | "sfx" | "subtitle";
  index: number;
}

export interface TrackConfig {
  id: string;
  type: "aroll" | "overlay" | "subtitle" | "sfx";
  label: string;
  height: number;
  color: string;
}

export const DEFAULT_TRACKS: TrackConfig[] = [
  { id: "aroll", type: "aroll", label: "A-Roll", height: 72, color: "#3b82f6" },
  { id: "overlay", type: "overlay", label: "Overlays", height: 56, color: "#6366f1" },
  { id: "subtitle", type: "subtitle", label: "Subtitles", height: 44, color: "#a855f7" },
  { id: "sfx", type: "sfx", label: "SFX", height: 36, color: "#f59e0b" },
];
