/**
 * CLI for testing individual pipeline stages
 *
 * Usage:
 *   npx tsx --env-file=.env src/cli.ts transcribe <video-path>
 *   npx tsx --env-file=.env src/cli.ts analyze <transcript-json> [assets-dir]
 *   npx tsx --env-file=.env src/cli.ts edit <video-path> <edits-json> [assets-dir]
 *   npx tsx --env-file=.env src/cli.ts subtitles <video-path> <edits-json> <short-index>
 *   npx tsx --env-file=.env src/cli.ts full <video-path> [assets-dir]
 */

import { mkdir } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transcribe } from "./transcribe.js";
import { analyzeTranscript } from "./analyze.js";
import { renderShort } from "./edit.js";
import { addSubtitles } from "./subtitles.js";
import type { AssetIndex, ShortEdit } from "./types.js";

const [, , command, ...args] = process.argv;

const TMP = path.join(process.cwd(), "tmp", "cli-test");
const OUT = path.join(process.cwd(), "output", "cli-test");

function buildAssetIndex(assetsDir: string): AssetIndex {
  const fs = require("node:fs");
  const index: AssetIndex = { broll: [], graphs: [], sfx: [] };

  for (const [subdir, key] of [
    ["broll", "broll"],
    ["graphs", "graphs"],
    ["sfx", "sfx"],
  ] as const) {
    const dir = path.join(assetsDir, subdir);
    if (fs.existsSync(dir)) {
      for (const file of fs.readdirSync(dir)) {
        index[key].push({
          label: path.parse(file).name,
          path: path.join(dir, file),
        });
      }
    }
  }
  return index;
}

async function main() {
  await mkdir(TMP, { recursive: true });
  await mkdir(OUT, { recursive: true });

  switch (command) {
    case "transcribe": {
      const videoPath = args[0];
      if (!videoPath) {
        console.error("Usage: cli.ts transcribe <video-path>");
        process.exit(1);
      }
      console.log(`Transcribing: ${videoPath}`);
      const transcript = await transcribe(videoPath, TMP);
      const outPath = path.join(OUT, "transcript.json");
      await writeFile(outPath, JSON.stringify(transcript, null, 2));
      console.log(`Transcript saved to: ${outPath}`);
      console.log(`${transcript.segments.length} segments, ${Math.round(transcript.duration)}s`);
      break;
    }

    case "analyze": {
      const transcriptPath = args[0];
      const assetsDir = args[1] || path.join(process.cwd(), "assets");
      if (!transcriptPath) {
        console.error("Usage: cli.ts analyze <transcript-json> [assets-dir]");
        process.exit(1);
      }
      const transcript = JSON.parse(await readFile(transcriptPath, "utf-8"));
      const assets = buildAssetIndex(assetsDir);
      console.log(`Analyzing with ${assets.broll.length} b-roll, ${assets.graphs.length} graphs, ${assets.sfx.length} sfx`);
      const edits = await analyzeTranscript(transcript, assets);
      const outPath = path.join(OUT, "edits.json");
      await writeFile(outPath, JSON.stringify(edits, null, 2));
      console.log(`Edit decisions saved to: ${outPath}`);
      break;
    }

    case "edit": {
      const videoPath = args[0];
      const editsPath = args[1];
      const assetsDir = args[2] || path.join(process.cwd(), "assets");
      if (!videoPath || !editsPath) {
        console.error("Usage: cli.ts edit <video-path> <edits-json> [assets-dir]");
        process.exit(1);
      }
      const edits: ShortEdit[] = JSON.parse(await readFile(editsPath, "utf-8"));
      const assets = buildAssetIndex(assetsDir);
      for (const edit of edits) {
        console.log(`\nRendering short #${edit.id}: "${edit.title}"`);
        const result = await renderShort(videoPath, edit, assets, OUT, TMP);
        console.log(`Output: ${result}`);
      }
      break;
    }

    case "subtitles": {
      const videoPath = args[0];
      const editsPath = args[1];
      const shortIndex = parseInt(args[2] ?? "0", 10);
      if (!videoPath || !editsPath) {
        console.error("Usage: cli.ts subtitles <video-path> <edits-json> <short-index>");
        process.exit(1);
      }
      const edits: ShortEdit[] = JSON.parse(await readFile(editsPath, "utf-8"));
      const edit = edits[shortIndex];
      if (!edit) {
        console.error(`Short index ${shortIndex} not found (${edits.length} shorts available)`);
        process.exit(1);
      }
      const totalDuration = edit.segmentsToKeep.reduce(
        (sum, seg) => sum + (seg.end - seg.start), 0
      );
      const outPath = path.join(OUT, `final_${edit.id}.mp4`);
      console.log(`Adding subtitles to short #${edit.id}: "${edit.title}"`);
      await addSubtitles(videoPath, edit.subtitleWords, totalDuration, outPath, TMP);
      console.log(`Output: ${outPath}`);
      break;
    }

    case "full": {
      const videoPath = args[0];
      const assetsDir = args[1] || path.join(process.cwd(), "assets");
      if (!videoPath) {
        console.error("Usage: cli.ts full <video-path> [assets-dir]");
        process.exit(1);
      }
      const assets = buildAssetIndex(assetsDir);

      console.log("=== Step 1: Transcribe ===");
      const transcript = await transcribe(videoPath, TMP);
      await writeFile(path.join(OUT, "transcript.json"), JSON.stringify(transcript, null, 2));
      console.log(`${transcript.segments.length} segments, ${Math.round(transcript.duration)}s\n`);

      console.log("=== Step 2: Analyze ===");
      const edits = await analyzeTranscript(transcript, assets);
      await writeFile(path.join(OUT, "edits.json"), JSON.stringify(edits, null, 2));
      console.log(`${edits.length} shorts identified\n`);

      console.log("=== Step 3: Edit + Subtitles ===");
      for (const edit of edits) {
        console.log(`\nRendering short #${edit.id}: "${edit.title}"`);
        const editedPath = await renderShort(videoPath, edit, assets, OUT, TMP);
        const totalDuration = edit.segmentsToKeep.reduce(
          (sum, seg) => sum + (seg.end - seg.start), 0
        );
        const finalPath = path.join(OUT, `final_${edit.id}_${edit.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`);
        await addSubtitles(editedPath, edit.subtitleWords, totalDuration, finalPath, TMP);
        console.log(`Done: ${finalPath}`);
      }
      console.log("\n=== All done ===");
      break;
    }

    default:
      console.log(`Video Pipeline CLI - Test individual stages

Commands:
  transcribe <video>                          Run whisper.cpp on a local video file
  analyze <transcript.json> [assets-dir]      Send transcript to Claude for edit decisions
  edit <video> <edits.json> [assets-dir]      Render all shorts with FFmpeg
  subtitles <video> <edits.json> <index>      Add subtitles to a single rendered short
  full <video> [assets-dir]                   Run the full pipeline locally (no Drive/Telegram)

Examples:
  npx tsx --env-file=.env src/cli.ts transcribe ~/my-video.mp4
  npx tsx --env-file=.env src/cli.ts analyze output/cli-test/transcript.json
  npx tsx --env-file=.env src/cli.ts edit ~/my-video.mp4 output/cli-test/edits.json
  npx tsx --env-file=.env src/cli.ts subtitles output/cli-test/short_1_Title.mp4 output/cli-test/edits.json 0
  npx tsx --env-file=.env src/cli.ts full ~/my-video.mp4`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
