import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Transcript, TranscriptSegment, WordTimestamp } from "./types";

const exec = promisify(execFile);

const WHISPER_BIN = path.join(
  process.env.HOME ?? "~",
  "whisper.cpp",
  "build",
  "bin",
  "whisper-cli"
);
const WHISPER_MODEL = path.join(
  process.env.HOME ?? "~",
  "whisper.cpp",
  "models",
  "ggml-large-v3.bin"
);

interface WhisperToken {
  text: string;
  offsets: { from: number; to: number };
  id: number;
  p: number;
}

interface WhisperSegment {
  text: string;
  offsets: { from: number; to: number };
  tokens: WhisperToken[];
}

/**
 * Merge sub-word tokens into full words with timestamps.
 * Tokens starting with a space begin a new word, others continue the previous.
 */
function tokensToWords(tokens: WhisperToken[]): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  const realTokens = tokens.filter((t) => !t.text.startsWith("["));

  for (const token of realTokens) {
    const isNewWord = token.text.startsWith(" ") || words.length === 0;
    const text = token.text.trimStart();
    if (!text) continue;

    if (isNewWord) {
      words.push({
        word: text,
        start: token.offsets.from / 1000,
        end: token.offsets.to / 1000,
      });
    } else if (words.length > 0) {
      const last = words[words.length - 1];
      last.word += text;
      last.end = token.offsets.to / 1000;
    }
  }

  return words;
}

async function convertToWav(inputPath: string, tmpDir: string): Promise<string> {
  const wavPath = path.join(tmpDir, "audio.wav");
  await exec("ffmpeg", [
    "-i", inputPath,
    "-ar", "16000",
    "-ac", "1",
    "-c:a", "pcm_s16le",
    "-y",
    wavPath,
  ]);
  return wavPath;
}

export async function transcribe(
  inputPath: string,
  tmpDir: string
): Promise<Transcript> {
  console.log(`[transcribe] Converting to WAV...`);
  const wavPath = await convertToWav(inputPath, tmpDir);

  const outputBase = path.join(tmpDir, "transcript");

  console.log("[transcribe] Running whisper.cpp...");
  await exec(
    WHISPER_BIN,
    [
      "-m", WHISPER_MODEL,
      "-f", wavPath,
      "--output-json-full",
      "--output-file", outputBase,
      "--print-progress",
      "--threads", "8",
    ],
    { maxBuffer: 50 * 1024 * 1024, timeout: 60 * 60 * 1000 }
  );

  const jsonPath = `${outputBase}.json`;
  const raw = JSON.parse(await readFile(jsonPath, "utf-8"));

  const segments: TranscriptSegment[] = raw.transcription.map(
    (seg: WhisperSegment) => ({
      text: seg.text.trim(),
      start: seg.offsets.from / 1000,
      end: seg.offsets.to / 1000,
      words: tokensToWords(seg.tokens),
    })
  );

  const fullText = segments.map((s) => s.text).join(" ");
  const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

  console.log(
    `[transcribe] Done. ${segments.length} segments, ${duration.toFixed(1)}s`
  );

  return { segments, fullText, duration };
}
