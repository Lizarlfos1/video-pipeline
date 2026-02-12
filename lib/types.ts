export interface WordTimestamp {
  word: string;
  start: number; // seconds in original video
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

export interface KeepSegment {
  start: number;
  end: number;
}

export interface ShortResult {
  id: number;
  title: string;
  scriptText: string;
  transcriptText: string;
  words: WordTimestamp[];
  sourceStart: number;
  sourceEnd: number;
  segmentsToKeep: KeepSegment[];
}
