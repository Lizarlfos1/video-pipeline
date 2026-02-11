/**
 * Analysis module - sends transcript to Claude to get structured edit decisions
 * Claude identifies: short boundaries, dead space, mistakes, emphasis, b-roll cues
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Transcript,
  ShortEdit,
  AssetIndex,
} from "./types.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a professional short-form video editor AI. You receive a full transcript with word-level timestamps from a long recording session, plus an index of available b-roll footage, graph images, and sound effects.

Your job is to return a JSON array of edit decisions for each individual short-form video found in the recording.

Rules:
- The recording contains approximately 10 separate short topics. Identify natural topic boundaries.
- Each short should be 30-90 seconds of final content.
- Remove all dead space (pauses > 0.8 seconds between words).
- Remove mistakes and retakes (when the speaker restarts a sentence, stumbles, or says things like "wait", "let me redo that", "actually no"). Keep only the final clean take.
- Identify 2-5 emphasis words per short that deserve a zoom effect (key terms, impactful words, numbers).
- Match b-roll and graph overlays based on what the speaker is discussing. Only use assets from the provided index.
- Add sound effect cues where appropriate (transitions, emphasis moments).
- For segmentsToKeep, provide timestamps relative to the ORIGINAL a-roll file (not relative to the short).
- subtitleWords should contain ALL words in the final cut (after removing silence and mistakes), with timestamps relative to the original a-roll.

Return ONLY valid JSON, no markdown fences, no explanation.`;

function buildUserPrompt(transcript: Transcript, assets: AssetIndex): string {
  return `## Transcript (with word-level timestamps in seconds)

${transcript.segments
  .map(
    (seg) =>
      `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}\n  Words: ${seg.words.map((w) => `${w.word}(${w.start.toFixed(2)})`).join(" ")}`
  )
  .join("\n\n")}

## Available Assets

### B-Roll
${assets.broll.map((a) => `- "${a.label}"`).join("\n")}

### Graphs
${assets.graphs.map((a) => `- "${a.label}"`).join("\n")}

### Sound Effects
${assets.sfx.map((a) => `- "${a.label}"`).join("\n")}

## Output Format
Return a JSON array of ShortEdit objects:
[
  {
    "id": 1,
    "title": "descriptive short title",
    "sourceStart": 0.0,
    "sourceEnd": 60.0,
    "segmentsToKeep": [{"start": 0.5, "end": 8.2}, {"start": 9.1, "end": 15.0}],
    "emphasisWords": [{"word": "compound", "timestamp": 3.4, "duration": 0.5}],
    "overlays": [{"type": "broll", "matchLabel": "stock-ticker", "startAt": 5.0, "duration": 3.0}],
    "sfx": [{"matchLabel": "whoosh", "at": 3.4}],
    "subtitleWords": [{"word": "So", "start": 0.5, "end": 0.7}, ...]
  }
]`;
}

export async function analyzeTranscript(
  transcript: Transcript,
  assets: AssetIndex
): Promise<ShortEdit[]> {
  console.log("[analyze] Sending transcript to Claude for edit decisions...");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(transcript, assets),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse Claude's response - strip markdown fences if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const edits: ShortEdit[] = JSON.parse(cleaned);

  console.log(`[analyze] Claude identified ${edits.length} shorts`);
  for (const edit of edits) {
    console.log(
      `  #${edit.id}: "${edit.title}" (${edit.segmentsToKeep.length} segments, ${edit.overlays.length} overlays)`
    );
  }

  return edits;
}
