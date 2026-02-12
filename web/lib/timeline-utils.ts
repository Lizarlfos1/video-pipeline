import type { KeepSegment, WordTimestamp } from "./types";

/** Convert source time (in a-roll) to concatenated time (in rendered short) */
export function sourceToConcatTime(
  sourceTime: number,
  segments: KeepSegment[]
): number | null {
  let concatOffset = 0;
  for (const seg of segments) {
    if (sourceTime >= seg.start && sourceTime <= seg.end) {
      return concatOffset + (sourceTime - seg.start);
    }
    concatOffset += seg.end - seg.start;
  }
  return null; // sourceTime is in a gap (removed content)
}

/** Convert concatenated time back to source time */
export function concatToSourceTime(
  concatTime: number,
  segments: KeepSegment[]
): number {
  let remaining = concatTime;
  for (const seg of segments) {
    const segDuration = seg.end - seg.start;
    if (remaining <= segDuration) {
      return seg.start + remaining;
    }
    remaining -= segDuration;
  }
  // Past end - return end of last segment
  const last = segments[segments.length - 1];
  return last ? last.end : 0;
}

/** Total duration of concatenated segments */
export function totalConcatDuration(segments: KeepSegment[]): number {
  return segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
}

/** Find which segment index contains a given source time, or -1 */
export function findSegmentAt(
  sourceTime: number,
  segments: KeepSegment[]
): number {
  return segments.findIndex(
    (seg) => sourceTime >= seg.start && sourceTime <= seg.end
  );
}

/** Convert pixel position to concat time */
export function pixelToTime(
  x: number,
  zoom: number,
  scrollX: number
): number {
  return (x + scrollX) / zoom;
}

/** Convert concat time to pixel position */
export function timeToPixel(
  time: number,
  zoom: number,
  scrollX: number
): number {
  return time * zoom - scrollX;
}

/** Format seconds as MM:SS.ms */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, "0")}`;
}

/** Format seconds as MM:SS */
export function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Remap subtitle words from source time to concat time */
export function remapWordsToConcatTime(
  words: WordTimestamp[],
  segments: KeepSegment[]
): WordTimestamp[] {
  return words
    .map((w) => {
      const start = sourceToConcatTime(w.start, segments);
      const end = sourceToConcatTime(w.end, segments);
      if (start === null || end === null) return null;
      return { ...w, start, end };
    })
    .filter((w): w is WordTimestamp => w !== null);
}

/** Get words that fall within given segments */
export function getWordsInSegments(
  allWords: WordTimestamp[],
  segments: KeepSegment[]
): WordTimestamp[] {
  return allWords.filter((w) =>
    segments.some((seg) => w.start >= seg.start && w.end <= seg.end)
  );
}
