/**
 * Transcription module - runs whisper.cpp locally on Apple Silicon
 * Produces word-level timestamps for the entire a-roll file
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Transcript, TranscriptSegment, WordTimestamp } from "./types.js";

const exec = promisify(execFile);

const WHISPER_BIN = path.join(process.env.HOME ?? "~", "whisper.cpp", "main");
const WHISPER_MODEL = path.join(
  process.env.HOME ?? "~",
  "whisper.cpp",
  "models",
  "ggml-large-v3.bin"
);

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  words: WhisperWord[];
}

/**
 * Convert audio/video to 16kHz WAV (whisper.cpp requirement)
 */
async function convertToWav(inputPath: string, tmpDir: string): Promise<string> {
  const wavPath = path.join(tmpDir, "audio.wav");
  await exec("ffmpeg", [
    "-i", inputPath,
    "-ar", "16000",    // 16kHz sample rate
    "-ac", "1",        // mono
    "-c:a", "pcm_s16le",
    "-y",              // overwrite
    wavPath,
  ]);
  return wavPath;
}

/**
 * Run whisper.cpp and return word-level timestamps
 */
export async function transcribe(
  inputPath: string,
  tmpDir: string
): Promise<Transcript> {
  console.log(`[transcribe] Converting ${inputPath} to WAV...`);
  const wavPath = await convertToWav(inputPath, tmpDir);

  const outputBase = path.join(tmpDir, "transcript");

  console.log("[transcribe] Running whisper.cpp (this may take a while)...");
  await exec(
    WHISPER_BIN,
    [
      "-m", WHISPER_MODEL,
      "-f", wavPath,
      "--output-json-full",
      "--output-file", outputBase,
      "--print-progress",
      "--threads", "8",   // M2 has 8 cores
    ],
    { maxBuffer: 50 * 1024 * 1024, timeout: 60 * 60 * 1000 } // 1 hour timeout
  );

  // whisper.cpp outputs to <outputBase>.json
  const jsonPath = `${outputBase}.json`;
  const raw = JSON.parse(await readFile(jsonPath, "utf-8"));

  const segments: TranscriptSegment[] = raw.transcription.map(
    (seg: WhisperSegment) => ({
      text: seg.text.trim(),
      start: seg.start / 1000, // whisper.cpp outputs ms
      end: seg.end / 1000,
      words: (seg.words ?? []).map((w: WhisperWord) => ({
        word: w.word.trim(),
        start: w.start / 1000,
        end: w.end / 1000,
      })),
    })
  );

  const fullText = segments.map((s) => s.text).join(" ");
  const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

  console.log(
    `[transcribe] Done. ${segments.length} segments, ${duration.toFixed(1)}s total`
  );

  return { segments, fullText, duration };
}
