/**
 * Script-to-transcript alignment module
 *
 * Instead of asking Claude to freely identify shorts (unreliable temporal reasoning),
 * we give it the user's pre-written script as ground truth and ask it to ALIGN —
 * find which transcript words correspond to each script paragraph, identify retakes,
 * and pick the best take. This is a much more constrained, reliable task.
 *
 * Pipeline:
 *   1. Parse script into paragraphs (sections)
 *   2. Flatten transcript words, detect & strip whisper hallucinations
 *   3. Claude identifies the KEEP word-index ranges per section (best take only)
 *   4. Post-process: map indices → timestamps, remove silences, build ShortEdit[]
 *
 * Each script paragraph = 1 short. No merging.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Transcript,
  ShortEdit,
  WordTimestamp,
  KeepSegment,
} from "./types.js";

const client = new Anthropic();

// ── Types ────────────────────────────────────────────────────────────

interface AlignmentSection {
  section: number;
  keepRanges: [number, number][]; // word index ranges [start, end] inclusive — only the best take
}

export interface AlignmentResult {
  shorts: ShortEdit[];
  metadata: {
    scriptSections: number;
    totalTakes: number;
    selectedTakes: number;
    silenceRemoved: number;
    hallucinatedWords: number;
  };
}

// ── Script parsing ───────────────────────────────────────────────────

/** Split script into paragraphs, filtering out empty lines */
function parseScriptSections(script: string): string[] {
  return script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Generate a short title from a paragraph's first sentence */
function titleFromParagraph(paragraph: string, index: number): string {
  const firstSentence = paragraph.split(/[.!?]/)[0].trim();
  const title = firstSentence.length > 60
    ? firstSentence.slice(0, 57) + "..."
    : firstSentence;
  return title || `Section ${index + 1}`;
}

// ── Whisper hallucination detection ──────────────────────────────────

/**
 * Detect and truncate whisper.cpp hallucination loops.
 * Whisper often repeats the same short phrase dozens/hundreds of times
 * during silence. We detect this by looking for a repeating n-gram pattern.
 */
function truncateHallucinations(words: WordTimestamp[]): {
  cleaned: WordTimestamp[];
  removedCount: number;
} {
  if (words.length < 20) return { cleaned: words, removedCount: 0 };

  // Build n-grams of 4-8 words and look for repeated sequences
  for (let ngramSize = 4; ngramSize <= 8; ngramSize++) {
    let repeatStart = -1;

    for (let i = 0; i <= words.length - ngramSize * 3; i++) {
      const pattern = words.slice(i, i + ngramSize).map((w) => w.word.toLowerCase()).join(" ");

      // Check if this pattern repeats at least 3 times consecutively
      let repeats = 1;
      let checkIdx = i + ngramSize;
      while (checkIdx + ngramSize <= words.length) {
        const candidate = words.slice(checkIdx, checkIdx + ngramSize).map((w) => w.word.toLowerCase()).join(" ");
        if (candidate === pattern) {
          repeats++;
          checkIdx += ngramSize;
        } else {
          break;
        }
      }

      if (repeats >= 3) {
        // Found a hallucination loop. Keep up to the first occurrence, discard the rest.
        repeatStart = i + ngramSize; // keep the first occurrence
        console.log(`[align] Detected whisper hallucination: "${pattern}" repeated ${repeats}x starting at word [${i}]. Truncating at word [${repeatStart}].`);
        break;
      }
    }

    if (repeatStart >= 0) {
      return {
        cleaned: words.slice(0, repeatStart),
        removedCount: words.length - repeatStart,
      };
    }
  }

  return { cleaned: words, removedCount: 0 };
}

// ── Transcript formatting ────────────────────────────────────────────

/** Flatten all transcript words into a single indexed array */
function flattenWords(transcript: Transcript): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  for (const seg of transcript.segments) {
    words.push(...seg.words);
  }
  return words;
}

/** Build compact indexed transcript: [0]word:0.0 [1]word:0.2 ... */
function buildIndexedTranscript(words: WordTimestamp[]): string {
  const parts: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (i > 0 && w.start - words[i - 1].end > 0.5) {
      parts.push("|");
    }
    parts.push(`[${i}]${w.word}:${w.start.toFixed(1)}`);
  }
  return parts.join(" ");
}

// ── Claude alignment ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a transcript alignment tool. You receive a script (what the speaker intended to say) and a timestamped transcript with word indices (what they actually said, recorded from speech recognition).

The speaker recorded themselves reading the script, but may have:
- Done multiple takes of the same sentence/paragraph (false starts, retakes)
- Stumbled, hesitated, or restarted mid-sentence
- Added filler words ("um", "uh", "okay", "so")
- Paraphrased slightly differently from the script

Your task: For each script section, identify ONLY the words from the BEST/FINAL clean take. Exclude all false starts, retakes, and incomplete attempts.

CRITICAL RULES:
- Return "keepRanges" — an array of [startIndex, endIndex] word-index ranges (inclusive) to KEEP
- Each range must be a continuous run of words that are part of the clean take
- You may return MULTIPLE ranges per section if the best take has natural pauses between sentences
- EXCLUDE false starts. E.g., if you see "Most inconsistent..." then "Most inconsistent drivers look where..." then "Most inconsistent drivers look where they currently are, at the apex", ONLY keep the last complete attempt
- EXCLUDE words that trail off with "..." — these are interrupted takes
- The ranges should be TIGHT — start at the first real word, end at the last real word
- Do NOT include the same words in multiple sections
- Sections appear in order in the transcript — section 2's words come after section 1's words

Return ONLY a valid JSON array, no markdown fences.`;

function buildAlignmentPrompt(
  sections: string[],
  indexedTranscript: string,
): string {
  const scriptPart = sections
    .map((s, i) => `${i + 1}: "${s}"`)
    .join("\n\n");

  return `## Script Sections
${scriptPart}

## Transcript (format: [wordIndex]word:timestamp, | = pause > 0.5s)
${indexedTranscript}

## Output Format (JSON array)
Return keepRanges for each section — ONLY the best/final take, no retakes:
[{"section":1,"keepRanges":[[4,38],[48,111],[126,170]]},{"section":2,"keepRanges":[[171,199]]}]

Each keepRanges entry is [firstWordIndex, lastWordIndex] inclusive.`;
}

// ── Silence removal ──────────────────────────────────────────────────

/**
 * Build tight segments from a word array, splitting at gaps > maxGap.
 * This algorithmically removes dead silence without any LLM.
 */
function buildSegmentsFromWords(
  words: WordTimestamp[],
  maxGap: number = 0.3,
): KeepSegment[] {
  if (words.length === 0) return [];

  const segments: KeepSegment[] = [];
  let segStart = words[0].start;
  let segEnd = words[0].end;

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - segEnd;
    if (gap > maxGap) {
      segments.push({ start: segStart, end: segEnd });
      segStart = words[i].start;
    }
    segEnd = words[i].end;
  }
  segments.push({ start: segStart, end: segEnd });
  return segments;
}

// ── Main alignment function ──────────────────────────────────────────

export async function alignScriptToTranscript(
  script: string,
  transcript: Transcript,
  options?: {
    maxSilenceGap?: number;
    minShortDuration?: number;
  },
): Promise<AlignmentResult> {
  const maxGap = options?.maxSilenceGap ?? 0.3;
  const minDur = options?.minShortDuration ?? 10;

  // Phase 1: Preprocessing
  const sections = parseScriptSections(script);
  if (sections.length === 0) {
    throw new Error("Script is empty — no paragraphs found");
  }

  let allWords = flattenWords(transcript);
  if (allWords.length === 0) {
    throw new Error("Transcript has no words");
  }

  // Detect and truncate whisper hallucinations
  const { cleaned, removedCount } = truncateHallucinations(allWords);
  allWords = cleaned;
  if (removedCount > 0) {
    console.log(`[align] Removed ${removedCount} hallucinated words, ${allWords.length} remaining`);
  }

  const indexedTranscript = buildIndexedTranscript(allWords);
  const userPrompt = buildAlignmentPrompt(sections, indexedTranscript);

  console.log(`[align] ${sections.length} script sections, ${allWords.length} transcript words`);
  console.log(`[align] Prompt: ~${Math.round(userPrompt.length / 4)} tokens`);

  // Phase 2: Claude alignment
  console.log("[align] Sending to Claude for alignment...");
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned2 = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let alignments: AlignmentSection[];
  try {
    alignments = JSON.parse(cleaned2);
  } catch (e) {
    console.error("[align] Failed to parse Claude response:", cleaned2.slice(0, 500));
    throw new Error("Failed to parse alignment response from Claude");
  }

  console.log(`[align] Claude returned ${alignments.length} section alignments`);
  for (const a of alignments) {
    console.log(`  Section ${a.section}: ${a.keepRanges.length} keep ranges — ${a.keepRanges.map(r => `[${r[0]}-${r[1]}]`).join(", ")}`);
  }
  console.log(`[align] Usage: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

  // Phase 3: Post-processing — each section = 1 short
  let totalSilenceRemoved = 0;
  const shorts: ShortEdit[] = [];

  for (const alignment of alignments) {
    if (!alignment.keepRanges || alignment.keepRanges.length === 0) {
      console.log(`  Section ${alignment.section}: no keep ranges, skipping`);
      continue;
    }

    // Collect all words from the keep ranges
    const keptWords: WordTimestamp[] = [];
    for (const [startIdx, endIdx] of alignment.keepRanges) {
      const s = Math.max(0, Math.min(startIdx, allWords.length - 1));
      const e = Math.max(0, Math.min(endIdx, allWords.length - 1));
      keptWords.push(...allWords.slice(s, e + 1));
    }

    if (keptWords.length === 0) continue;

    // Build tight segments (remove silence gaps > maxGap)
    const segments = buildSegmentsFromWords(keptWords, maxGap);
    const concatDur = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    const rawDuration = keptWords[keptWords.length - 1].end - keptWords[0].start;
    totalSilenceRemoved += rawDuration - concatDur;

    const sectionIdx = alignment.section - 1;
    const title = titleFromParagraph(
      sections[sectionIdx] ?? `Section ${alignment.section}`,
      sectionIdx,
    );

    shorts.push({
      id: shorts.length + 1,
      title,
      sourceStart: keptWords[0].start,
      sourceEnd: keptWords[keptWords.length - 1].end,
      segmentsToKeep: segments,
      emphasisWords: [],
      overlays: [],
      sfx: [],
      subtitleWords: keptWords.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })),
    });
  }

  // Filter out shorts that are too short
  const filteredShorts = shorts.filter((s) => {
    const dur = s.segmentsToKeep.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    if (dur < minDur) {
      console.log(`  Skipping short #${s.id} "${s.title}" — too short (${dur.toFixed(1)}s < ${minDur}s)`);
      return false;
    }
    return true;
  });

  // Re-number IDs
  filteredShorts.forEach((s, i) => {
    s.id = i + 1;
  });

  console.log(`[align] ${filteredShorts.length} shorts generated`);
  for (const s of filteredShorts) {
    const dur = s.segmentsToKeep.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
    console.log(`  #${s.id}: "${s.title}" (~${Math.round(dur)}s, ${s.segmentsToKeep.length} segments, ${s.subtitleWords.length} words)`);
  }
  console.log(`[align] ${totalSilenceRemoved.toFixed(1)}s of silence removed`);

  return {
    shorts: filteredShorts,
    metadata: {
      scriptSections: sections.length,
      totalTakes: alignments.reduce((sum, a) => sum + a.keepRanges.length, 0),
      selectedTakes: alignments.filter((a) => a.keepRanges.length > 0).length,
      silenceRemoved: totalSilenceRemoved,
      hallucinatedWords: removedCount,
    },
  };
}
