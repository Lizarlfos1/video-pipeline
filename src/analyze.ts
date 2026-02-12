/**
 * Analysis module - sends transcript to Claude to get structured edit decisions
 * Claude identifies: short boundaries, dead space, mistakes, emphasis, b-roll cues
 *
 * Token optimization: Claude returns a minimal schema (no subtitleWords, emphasis
 * words are just strings). We derive subtitleWords from segmentsToKeep + transcript,
 * and look up emphasis word timestamps from the transcript.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Transcript,
  ShortEdit,
  AssetIndex,
  WordTimestamp,
  EmphasisWord,
} from "./types.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a professional short-form video editor. You receive a transcript with word-level timestamps and available assets. Return a JSON array of edit decisions.

Rules:
- Find separate short topics in the recording. Each short: 30-90s of final content.
- Remove ALL dead space — no gap between words greater than 100ms in the final cut. Cut aggressively: remove pauses, breaths, filler words, and hesitations.
- Remove mistakes and retakes (restarts, stumbles, "wait", "let me redo that"). Keep only the final clean take.
- segmentsToKeep must be tight — end each segment right at the last word's end, start each segment right at the first word's start. No padding.
- Pick 2-5 emphasis words per short for zoom effect (key terms, impactful words, numbers).
- Use b-roll overlays generously — every short should have 2-4 b-roll/graph overlays lasting 2-5 seconds each, placed where the speaker references something visual. Only use asset labels from the provided list (exact match required).
- All timestamps reference the ORIGINAL a-roll (not relative to the short).

Return ONLY valid JSON array, no markdown fences.`;

/** Compact transcript: "word:time word:time | word:time" with | marking gaps > 0.1s */
function buildCompactTranscript(transcript: Transcript): string {
  const allWords: WordTimestamp[] = [];
  for (const seg of transcript.segments) {
    allWords.push(...seg.words);
  }

  const parts: string[] = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    if (i > 0 && w.start - allWords[i - 1].end > 0.1) {
      parts.push("|");
    }
    parts.push(`${w.word}:${w.start.toFixed(1)}`);
  }
  return parts.join(" ");
}

function buildUserPrompt(transcript: Transcript, assets: AssetIndex): string {
  return `## Transcript
Format: word:timestamp(s), | = pause > 0.1s (these pauses should be CUT)

${buildCompactTranscript(transcript)}

## Assets
B-Roll: ${assets.broll.map((a) => a.label).join(", ")}
Graphs: ${assets.graphs.map((a) => a.label).join(", ")}
SFX: ${assets.sfx.map((a) => a.label).join(", ")}

## Output
[{"id":1,"title":"short title","sourceStart":0.0,"sourceEnd":60.0,"segmentsToKeep":[{"start":0.5,"end":8.2}],"emphasisWords":["keyword1","keyword2"],"overlays":[{"type":"broll","matchLabel":"Label","startAt":5.0,"duration":3.0}],"sfx":[{"matchLabel":"whoosh","at":3.4}]}]`;
}

/** Find a word's timestamp in the transcript within a source range */
function findWordTimestamp(
  word: string,
  segments: Transcript["segments"],
  sourceStart: number,
  sourceEnd: number,
): EmphasisWord | null {
  const lower = word.toLowerCase();
  for (const seg of segments) {
    if (seg.end < sourceStart || seg.start > sourceEnd) continue;
    for (const w of seg.words) {
      if (w.word.toLowerCase() === lower && w.start >= sourceStart && w.end <= sourceEnd) {
        return { word: w.word, timestamp: w.start, duration: w.end - w.start };
      }
    }
  }
  return null;
}

/** Build subtitleWords from segmentsToKeep by filtering transcript words */
function buildSubtitleWords(
  segmentsToKeep: { start: number; end: number }[],
  transcript: Transcript,
): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  for (const keep of segmentsToKeep) {
    for (const seg of transcript.segments) {
      if (seg.end < keep.start || seg.start > keep.end) continue;
      for (const w of seg.words) {
        if (w.start >= keep.start && w.end <= keep.end) {
          words.push({ word: w.word, start: w.start, end: w.end });
        }
      }
    }
  }
  return words;
}

/** Minimal schema Claude returns (no subtitleWords, emphasisWords are just strings) */
interface ClaudeShortEdit {
  id: number;
  title: string;
  sourceStart: number;
  sourceEnd: number;
  segmentsToKeep: { start: number; end: number }[];
  emphasisWords: string[];
  overlays: { type: "broll" | "graph"; matchLabel: string; startAt: number; duration: number }[];
  sfx: { matchLabel: string; at: number }[];
}

export async function analyzeTranscript(
  transcript: Transcript,
  assets: AssetIndex
): Promise<ShortEdit[]> {
  const userPrompt = buildUserPrompt(transcript, assets);
  console.log(`[analyze] Prompt: ~${Math.round(userPrompt.length / 4)} tokens`);

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const raw: ClaudeShortEdit[] = JSON.parse(cleaned);

  // Enrich: look up emphasis timestamps + build subtitleWords from transcript
  const edits: ShortEdit[] = raw.map((r) => ({
    ...r,
    emphasisWords: r.emphasisWords
      .map((w) => findWordTimestamp(w, transcript.segments, r.sourceStart, r.sourceEnd))
      .filter((e): e is EmphasisWord => e !== null),
    subtitleWords: buildSubtitleWords(r.segmentsToKeep, transcript),
  }));

  console.log(`[analyze] ${edits.length} shorts identified`);
  for (const edit of edits) {
    const dur = edit.segmentsToKeep.reduce((s, seg) => s + (seg.end - seg.start), 0);
    console.log(`  #${edit.id}: "${edit.title}" (~${Math.round(dur)}s, ${edit.emphasisWords.length} emphasis, ${edit.overlays.length} overlays, ${edit.subtitleWords.length} words)`);
  }

  console.log(`[analyze] Usage: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
  return edits;
}
