/**
 * CLI entry point for the video pipeline
 *
 * Usage:
 *   npx tsx --env-file=.env src/cli.ts pull <drive-file-id-or-local-path>
 *   npx tsx --env-file=.env src/cli.ts transcribe [--run-dir <path>]
 *   npx tsx --env-file=.env src/cli.ts analyze [--run-dir <path>]
 *   npx tsx --env-file=.env src/cli.ts edit [--run-dir <path>] [--short <id>]
 *   npx tsx --env-file=.env src/cli.ts subtitles [--run-dir <path>] [--short <id>]
 *   npx tsx --env-file=.env src/cli.ts run <drive-file-id-or-local-path>
 */

import { mkdir, readFile, writeFile, copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Ensure Homebrew binaries (ffmpeg, etc.) are on PATH
if (!process.env.PATH?.includes("/opt/homebrew/bin")) {
  process.env.PATH = `/opt/homebrew/bin:${process.env.PATH}`;
}
import { readdirSync, existsSync } from "node:fs";
import { transcribe } from "./transcribe.js";
import { analyzeTranscript } from "./analyze.js";
import { renderShort } from "./edit.js";
import { addSubtitles } from "./subtitles.js";
import { pullARoll, pullAssets } from "./drive.js";
import type { AssetIndex, ShortEdit, RunDirectory, WordTimestamp } from "./types.js";

// ── Argument parsing ───────────────────────────────────────────────

const [, , command, ...rawArgs] = process.argv;

function getFlag(name: string): string | undefined {
  const idx = rawArgs.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= rawArgs.length) return undefined;
  return rawArgs[idx + 1];
}

function getPositionals(): string[] {
  const positionals: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i].startsWith("--")) {
      i++; // skip flag value
    } else {
      positionals.push(rawArgs[i]);
    }
  }
  return positionals;
}

// ── Run directory management ───────────────────────────────────────

const RUNS_DIR = path.join(process.cwd(), "runs");
const ASSETS_DIR = path.join(process.cwd(), "assets");
const DOWNLOADS_DIR = path.join(os.homedir(), "Downloads");

function runPaths(root: string): RunDirectory {
  return {
    root,
    aRollPath: path.join(root, "a-roll.mp4"),
    assetsJsonPath: path.join(root, "assets.json"),
    transcriptPath: path.join(root, "transcript.json"),
    editsPath: path.join(root, "edits.json"),
    shortsDir: path.join(root, "shorts"),
    finalsDir: path.join(root, "finals"),
    tmpDir: path.join(root, "tmp"),
  };
}

async function createRunDir(): Promise<RunDirectory> {
  const now = new Date();
  const stamp = now.toISOString().replace(/T/, "_").replace(/:/g, "").replace(/\..+/, "").slice(0, 15);
  const root = path.join(RUNS_DIR, stamp);

  await mkdir(root, { recursive: true });
  const run = runPaths(root);
  await mkdir(run.shortsDir, { recursive: true });
  await mkdir(run.finalsDir, { recursive: true });
  await mkdir(run.tmpDir, { recursive: true });

  console.log(`[cli] Created run directory: ${root}`);
  return run;
}

async function resolveRunDir(explicit?: string): Promise<RunDirectory> {
  if (explicit) {
    const root = path.resolve(explicit);
    if (!existsSync(root)) {
      throw new Error(`Run directory not found: ${root}`);
    }
    return runPaths(root);
  }

  if (!existsSync(RUNS_DIR)) {
    throw new Error(`No runs/ directory found. Run "pull" first to create one.`);
  }

  const entries = readdirSync(RUNS_DIR)
    .filter((e) => !e.startsWith("."))
    .sort()
    .reverse();

  if (entries.length === 0) {
    throw new Error(`No runs found in runs/. Run "pull" first.`);
  }

  const latest = entries[0];
  if (entries.length > 1) {
    console.log(`[cli] Multiple runs found, using most recent: ${latest}`);
  }

  return runPaths(path.join(RUNS_DIR, latest));
}

async function requireFile(filePath: string, stage: string): Promise<void> {
  try {
    await stat(filePath);
  } catch {
    const rel = path.relative(process.cwd(), filePath);
    throw new Error(`Required file missing: ${rel}\nRun "${stage}" first.`);
  }
}

// ── Asset index from local disk ────────────────────────────────────

function buildAssetIndex(assetsDir: string): AssetIndex {
  const index: AssetIndex = { broll: [], graphs: [], sfx: [] };

  for (const [subdir, key] of [
    ["broll", "broll"],
    ["graphs", "graphs"],
    ["sfx", "sfx"],
  ] as const) {
    const dir = path.join(assetsDir, subdir);
    if (existsSync(dir)) {
      for (const file of readdirSync(dir)) {
        if (file.startsWith(".")) continue;
        index[key].push({
          label: path.parse(file).name,
          path: path.join(dir, file),
        });
      }
    }
  }
  return index;
}

// ── Environment validation ─────────────────────────────────────────

function requireEnvDriveFolders() {
  const bRollFolderId = process.env.GOOGLE_DRIVE_BROLL_FOLDER_ID;
  const graphsFolderId = process.env.GOOGLE_DRIVE_GRAPHS_FOLDER_ID;
  const sfxFolderId = process.env.GOOGLE_DRIVE_SFX_FOLDER_ID;

  if (!bRollFolderId || !graphsFolderId || !sfxFolderId) {
    throw new Error(
      "Missing Google Drive folder IDs in .env\n" +
        "Required: GOOGLE_DRIVE_BROLL_FOLDER_ID, GOOGLE_DRIVE_GRAPHS_FOLDER_ID, GOOGLE_DRIVE_SFX_FOLDER_ID"
    );
  }
  return { bRollFolderId, graphsFolderId, sfxFolderId };
}

function isLocalFile(input: string): boolean {
  return input.includes("/") || input.includes("\\") || /\.(mp4|mov|mkv|avi|webm)$/i.test(input);
}

// ── Commands ───────────────────────────────────────────────────────

async function cmdPull(input: string) {
  const run = await createRunDir();

  if (isLocalFile(input)) {
    // Local file — copy into run directory
    const src = path.resolve(input);
    if (!existsSync(src)) throw new Error(`File not found: ${src}`);
    console.log(`[pull] Copying local file: ${src}`);
    await copyFile(src, run.aRollPath);
    await writeFile(path.join(run.root, "a-roll-source.txt"), `local: ${src}`);
  } else {
    // Google Drive file ID
    console.log(`[pull] Downloading a-roll from Drive: ${input}`);
    const downloaded = await pullARoll(input, run.tmpDir);
    // Copy to standard location (rename can fail across mount points)
    await copyFile(downloaded, run.aRollPath);
    await writeFile(path.join(run.root, "a-roll-source.txt"), `drive: ${input}`);
  }

  // Sync assets from Drive (cached in ./assets/)
  const { bRollFolderId, graphsFolderId, sfxFolderId } = requireEnvDriveFolders();
  await mkdir(ASSETS_DIR, { recursive: true });
  const assets = await pullAssets(bRollFolderId, graphsFolderId, sfxFolderId, ASSETS_DIR);
  await writeFile(run.assetsJsonPath, JSON.stringify(assets, null, 2));

  console.log(`\n[pull] Done. Run directory: ${run.root}`);
  console.log(`  A-roll: ${run.aRollPath}`);
  console.log(`  Assets: ${assets.broll.length} b-roll, ${assets.graphs.length} graphs, ${assets.sfx.length} sfx`);
  console.log(`\nNext: npm run transcribe`);
}

async function cmdTranscribe(run: RunDirectory) {
  await requireFile(run.aRollPath, "npm run pull -- <source>");

  console.log(`[transcribe] Input: ${run.aRollPath}`);
  const transcript = await transcribe(run.aRollPath, run.tmpDir);
  await writeFile(run.transcriptPath, JSON.stringify(transcript, null, 2));

  console.log(`\n[transcribe] Done. ${transcript.segments.length} segments, ${Math.round(transcript.duration)}s`);
  console.log(`  Saved: ${run.transcriptPath}`);
  console.log(`\nNext: npm run analyze`);
}

async function cmdAnalyze(run: RunDirectory) {
  await requireFile(run.transcriptPath, "npm run transcribe");
  await requireFile(run.assetsJsonPath, "npm run pull -- <source>");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY in .env");
  }

  const transcript = JSON.parse(await readFile(run.transcriptPath, "utf-8"));
  const assets: AssetIndex = JSON.parse(await readFile(run.assetsJsonPath, "utf-8"));

  console.log(`[analyze] Sending transcript to Claude...`);
  console.log(`  Assets: ${assets.broll.length} b-roll, ${assets.graphs.length} graphs, ${assets.sfx.length} sfx`);

  const edits = await analyzeTranscript(transcript, assets);
  await writeFile(run.editsPath, JSON.stringify(edits, null, 2));

  console.log(`\n[analyze] Done. ${edits.length} shorts identified:`);
  for (const edit of edits) {
    const dur = edit.segmentsToKeep.reduce((s, seg) => s + (seg.end - seg.start), 0);
    console.log(`  #${edit.id}: "${edit.title}" (~${Math.round(dur)}s, ${edit.overlays.length} overlays)`);
  }
  console.log(`  Saved: ${run.editsPath}`);
  console.log(`\nNext: npm run edit [-- --short <id>]`);
}

async function cmdEdit(run: RunDirectory, shortId?: number) {
  await requireFile(run.editsPath, "npm run analyze");
  await requireFile(run.aRollPath, "npm run pull -- <source>");
  await requireFile(run.assetsJsonPath, "npm run pull -- <source>");

  const edits: ShortEdit[] = JSON.parse(await readFile(run.editsPath, "utf-8"));
  const assets: AssetIndex = JSON.parse(await readFile(run.assetsJsonPath, "utf-8"));

  const toRender = shortId != null
    ? edits.filter((e) => e.id === shortId)
    : edits;

  if (toRender.length === 0) {
    throw new Error(
      shortId != null
        ? `Short #${shortId} not found. Available: ${edits.map((e) => e.id).join(", ")}`
        : "No shorts found in edits.json"
    );
  }

  console.log(`[edit] Rendering ${toRender.length} short(s)...`);

  for (const edit of toRender) {
    console.log(`\n  Rendering short #${edit.id}: "${edit.title}"`);
    const result = await renderShort(run.aRollPath, edit, assets, run.shortsDir, run.tmpDir);
    console.log(`  Output: ${result}`);
  }

  console.log(`\n[edit] Done. Rendered ${toRender.length} short(s) to ${run.shortsDir}`);
  console.log(`\nNext: npm run subtitles [-- --short <id>]`);
}

/** Remap word timestamps from original a-roll time to concatenated short time */
function remapWordsToConcatTime(
  words: WordTimestamp[],
  segments: { start: number; end: number }[],
): WordTimestamp[] {
  const result: WordTimestamp[] = [];
  for (const w of words) {
    let offset = 0;
    for (const seg of segments) {
      if (w.start >= seg.start && w.end <= seg.end) {
        result.push({
          word: w.word,
          start: offset + (w.start - seg.start),
          end: offset + (w.end - seg.start),
        });
        break;
      }
      offset += seg.end - seg.start;
    }
  }
  return result;
}

async function cmdSubtitles(run: RunDirectory, shortId?: number) {
  await requireFile(run.editsPath, "npm run analyze");

  const edits: ShortEdit[] = JSON.parse(await readFile(run.editsPath, "utf-8"));

  const toProcess = shortId != null
    ? edits.filter((e) => e.id === shortId)
    : edits;

  if (toProcess.length === 0) {
    throw new Error(
      shortId != null
        ? `Short #${shortId} not found. Available: ${edits.map((e) => e.id).join(", ")}`
        : "No shorts found in edits.json"
    );
  }

  console.log(`[subtitles] Processing ${toProcess.length} short(s)...`);
  const copied: string[] = [];

  for (const edit of toProcess) {
    const safeName = edit.title.replace(/[^a-zA-Z0-9]/g, "_");
    const shortPath = path.join(run.shortsDir, `short_${edit.id}_${safeName}.mp4`);
    await requireFile(shortPath, `npm run edit -- --short ${edit.id}`);

    const totalDuration = edit.segmentsToKeep.reduce(
      (sum, seg) => sum + (seg.end - seg.start),
      0
    );

    // Remap subtitle word timestamps from original a-roll to concatenated timeline
    const remappedWords = remapWordsToConcatTime(edit.subtitleWords, edit.segmentsToKeep);

    const finalPath = path.join(run.finalsDir, `final_${edit.id}_${safeName}.mp4`);

    console.log(`\n  Adding subtitles to short #${edit.id}: "${edit.title}" (${remappedWords.length} words, ${totalDuration.toFixed(1)}s)`);
    await addSubtitles(shortPath, remappedWords, totalDuration, finalPath, run.tmpDir);

    // Copy to ~/Downloads
    const downloadsDest = path.join(DOWNLOADS_DIR, `${safeName}.mp4`);
    await copyFile(finalPath, downloadsDest);
    copied.push(downloadsDest);
    console.log(`  Copied to: ${downloadsDest}`);
  }

  console.log(`\n[subtitles] Done. ${copied.length} video(s) copied to ~/Downloads:`);
  for (const p of copied) {
    console.log(`  ${p}`);
  }
}

async function cmdRun(input: string) {
  console.log("=== Video Pipeline - Full Run ===\n");

  // Step 1: Pull
  console.log("--- Step 1/5: Pull ---");
  await cmdPull(input);

  // Resolve the run we just created
  const run = await resolveRunDir();

  // Step 2: Transcribe
  console.log("\n--- Step 2/5: Transcribe ---");
  await cmdTranscribe(run);

  // Step 3: Analyze
  console.log("\n--- Step 3/5: Analyze ---");
  await cmdAnalyze(run);

  // Step 4: Edit
  console.log("\n--- Step 4/5: Edit ---");
  await cmdEdit(run);

  // Step 5: Subtitles
  console.log("\n--- Step 5/5: Subtitles ---");
  await cmdSubtitles(run);

  console.log("\n=== Pipeline complete ===");
}

// ── Help ───────────────────────────────────────────────────────────

function showHelp() {
  console.log(`Video Pipeline CLI

Commands:
  pull <drive-id|local-path>    Download a-roll from Drive (or copy local file) + sync assets
  transcribe                    Transcribe a-roll with whisper.cpp
  analyze                       Send transcript to Claude for edit decisions
  edit [--short <id>]           Render shorts with FFmpeg (or just one)
  subtitles [--short <id>]      Add animated subtitles, copy to ~/Downloads
  run <drive-id|local-path>     Full pipeline end-to-end

Options:
  --run-dir <path>              Use a specific run directory (default: most recent)
  --short <id>                  Process only one short by ID

Examples:
  npm run pull -- abc123def                   Pull from Google Drive
  npm run pull -- ~/Videos/my-recording.mp4   Use a local file
  npm run transcribe                          Transcribe (uses latest run)
  npm run analyze                             Get edit decisions from Claude
  npm run edit -- --short 3                   Render just short #3
  npm run subtitles -- --short 3              Subtitle short #3 -> ~/Downloads
  npm run run -- abc123def                    Full pipeline from Drive

  npm run edit -- --run-dir runs/20260212_143052   Target a specific run`);
}

// ── Main dispatch ──────────────────────────────────────────────────

async function main() {
  const runDirFlag = getFlag("run-dir");
  const shortFlag = getFlag("short");
  const shortId = shortFlag != null ? parseInt(shortFlag, 10) : undefined;
  const positionals = getPositionals();

  switch (command) {
    case "pull": {
      const input = positionals[0];
      if (!input) {
        console.error("Usage: pull <drive-file-id|local-path>");
        process.exit(1);
      }
      await cmdPull(input);
      break;
    }

    case "transcribe": {
      const run = await resolveRunDir(runDirFlag);
      await cmdTranscribe(run);
      break;
    }

    case "analyze": {
      const run = await resolveRunDir(runDirFlag);
      await cmdAnalyze(run);
      break;
    }

    case "edit": {
      const run = await resolveRunDir(runDirFlag);
      await cmdEdit(run, shortId);
      break;
    }

    case "subtitles": {
      const run = await resolveRunDir(runDirFlag);
      await cmdSubtitles(run, shortId);
      break;
    }

    case "run": {
      const input = positionals[0];
      if (!input) {
        console.error("Usage: run <drive-file-id|local-path>");
        process.exit(1);
      }
      await cmdRun(input);
      break;
    }

    default:
      showHelp();
  }
}

main().catch((err) => {
  console.error(`\nError: ${err.message ?? err}`);
  process.exit(1);
});
