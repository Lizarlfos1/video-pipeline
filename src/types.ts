/** Shared types for the video pipeline */

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number;   // seconds
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
  timestamp: number; // seconds
  duration: number;
}

export interface Overlay {
  type: "broll" | "graph";
  matchLabel: string;   // label to match against drive assets
  filePath?: string;    // resolved path after matching
  startAt: number;      // seconds into the short
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
  sourceStart: number;     // start in original a-roll (seconds)
  sourceEnd: number;       // end in original a-roll (seconds)
  segmentsToKeep: KeepSegment[]; // after removing silence + mistakes
  emphasisWords: EmphasisWord[];
  overlays: Overlay[];
  sfx: SFXCue[];
  subtitleWords: WordTimestamp[]; // for Remotion captions
}

export interface PipelineConfig {
  aRollPath: string;
  bRollDir: string;
  graphsDir: string;
  sfxDir: string;
  outputDir: string;
  driveCompletedFolderId: string;
}

export interface AssetIndex {
  broll: { label: string; path: string }[];
  graphs: { label: string; path: string }[];
  sfx: { label: string; path: string }[];
}
