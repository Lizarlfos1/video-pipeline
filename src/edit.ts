/**
 * FFmpeg editing module - cuts, trims, zooms, overlays b-roll/graphs, mixes SFX
 * Uses VideoToolbox hardware acceleration on Apple Silicon
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ShortEdit, AssetIndex } from "./types.js";

const execAsync = promisify(execFile);

/** Run ffmpeg with stderr logging on failure */
async function ffmpeg(
  args: string[],
  opts?: { maxBuffer?: number; timeout?: number }
): Promise<void> {
  try {
    await execAsync("ffmpeg", args, {
      maxBuffer: opts?.maxBuffer ?? 50 * 1024 * 1024,
      timeout: opts?.timeout ?? 30 * 60 * 1000,
    });
  } catch (err: any) {
    // Log stderr for debugging
    if (err.stderr) {
      console.error("[edit] FFmpeg stderr:", err.stderr.slice(-2000));
    }
    throw err;
  }
}

/** Check that an output file exists and has content */
async function validateOutput(filePath: string, label: string): Promise<void> {
  try {
    const s = await stat(filePath);
    if (s.size < 1000) {
      throw new Error(`${label}: output file is too small (${s.size} bytes), likely empty`);
    }
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(`${label}: output file was not created`);
    }
    throw err;
  }
}

/**
 * Resolve asset labels to actual file paths
 */
function resolveAssets(edit: ShortEdit, assets: AssetIndex): ShortEdit {
  const resolved = { ...edit };

  resolved.overlays = edit.overlays.map((o) => {
    const pool = o.type === "broll" ? assets.broll : assets.graphs;
    const match = pool.find(
      (a) => a.label.toLowerCase() === o.matchLabel.toLowerCase()
    );
    return { ...o, filePath: match?.path };
  });

  resolved.sfx = edit.sfx.map((s) => {
    const match = assets.sfx.find(
      (a) => a.label.toLowerCase() === s.matchLabel.toLowerCase()
    );
    return { ...s, filePath: match?.path };
  });

  return resolved;
}

/**
 * Build an FFmpeg filter_complex for a single short
 * Handles: segment concatenation + zoom via crop/scale overlay
 */
function buildFilterComplex(edit: ShortEdit): {
  filterComplex: string;
  outputMap: string[];
} {
  const filters: string[] = [];
  const segments = edit.segmentsToKeep;

  // Step 1: Trim each keep-segment from the source
  segments.forEach((seg, i) => {
    filters.push(
      `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`
    );
    filters.push(
      `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`
    );
  });

  // Step 2: Concatenate all segments
  const concatInputs = segments.map((_, i) => `[v${i}][a${i}]`).join("");
  filters.push(
    `${concatInputs}concat=n=${segments.length}:v=1:a=1[vconcat][aconcat]`
  );

  // Step 3: Scale and crop to portrait (9:16) — crop-to-fill, not letterbox
  filters.push(`[vconcat]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vscaled]`);

  // Step 4: Apply zoom on emphasis words using crop+overlay (not zoompan)
  // Build zoom enable condition for all emphasis words
  const zoomWindows = edit.emphasisWords
    .map((ew) => {
      const concatTime = mapToConcatTime(ew.timestamp, edit.segmentsToKeep);
      if (concatTime === null) return null;
      const start = concatTime;
      const end = concatTime + (ew.duration || 0.5);
      return { start, end };
    })
    .filter((w): w is { start: number; end: number } => w !== null);

  let finalVideo = "vscaled";

  if (zoomWindows.length > 0) {
    // Create a zoomed version: crop center 1/1.3 of the frame, scale back up
    const zoomFactor = 1.3;
    const cropW = Math.round(1080 / zoomFactor);
    const cropH = Math.round(1920 / zoomFactor);
    const cropX = Math.round((1080 - cropW) / 2);
    const cropY = Math.round((1920 - cropH) / 2);

    filters.push(
      `[vscaled]split=2[vbase][vforzoom]`
    );
    filters.push(
      `[vforzoom]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=1080:1920[vzoomed]`
    );

    // Overlay zoomed version only during emphasis windows
    const enableExpr = zoomWindows
      .map((w) => `between(t\\,${w.start.toFixed(3)}\\,${w.end.toFixed(3)})`)
      .join("+");

    filters.push(
      `[vbase][vzoomed]overlay=0:0:enable='${enableExpr}'[vfinal]`
    );
    finalVideo = "vfinal";
  }

  return {
    filterComplex: filters.join(";\n"),
    outputMap: [`-map`, `[${finalVideo}]`, `-map`, `[aconcat]`],
  };
}

/**
 * Map an original a-roll timestamp to the concatenated timeline
 */
function mapToConcatTime(
  originalTime: number,
  segments: { start: number; end: number }[]
): number | null {
  let concatOffset = 0;
  for (const seg of segments) {
    if (originalTime >= seg.start && originalTime <= seg.end) {
      return concatOffset + (originalTime - seg.start);
    }
    concatOffset += seg.end - seg.start;
  }
  return null;
}

/**
 * Render a single short from the a-roll using FFmpeg
 */
export async function renderShort(
  aRollPath: string,
  edit: ShortEdit,
  assets: AssetIndex,
  outputDir: string,
  tmpDir: string
): Promise<string> {
  const resolved = resolveAssets(edit, assets);
  const outputPath = path.join(
    outputDir,
    `short_${edit.id}_${edit.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`
  );

  console.log(`[edit] Rendering short #${edit.id}: "${edit.title}"`);

  // Build the base cut (segments + zoom)
  const baseCutPath = path.join(tmpDir, `base_${edit.id}.mp4`);
  const { filterComplex, outputMap } = buildFilterComplex(resolved);

  // Write filter to file for debugging
  const filterPath = path.join(tmpDir, `filter_${edit.id}.txt`);
  await writeFile(filterPath, filterComplex);
  console.log(`[edit] Filter written to ${filterPath}`);

  // Step 1: Base cut with zoom
  await ffmpeg([
    "-i", aRollPath,
    "-filter_complex_script", filterPath,
    ...outputMap,
    "-c:v", "h264_videotoolbox",
    "-b:v", "8M",
    "-c:a", "aac",
    "-b:a", "192k",
    "-y",
    baseCutPath,
  ]);
  await validateOutput(baseCutPath, `Short #${edit.id} base cut`);

  // Step 2: Overlay b-roll and graphs
  let currentPath = baseCutPath;
  for (let i = 0; i < resolved.overlays.length; i++) {
    const overlay = resolved.overlays[i];
    if (!overlay.filePath) {
      console.log(
        `  [edit] Skipping overlay "${overlay.matchLabel}" - no matching file`
      );
      continue;
    }

    const overlayStart = mapToConcatTime(overlay.startAt, edit.segmentsToKeep);
    if (overlayStart === null) {
      console.log(`  [edit] Skipping overlay "${overlay.matchLabel}" - timestamp ${overlay.startAt}s outside kept segments`);
      continue;
    }

    const overlayEnd = overlayStart + overlay.duration;
    console.log(`  [edit] Overlay ${overlay.type} "${overlay.matchLabel}" at ${overlayStart.toFixed(1)}-${overlayEnd.toFixed(1)}s`);

    const overlayOutput = path.join(tmpDir, `overlay_${edit.id}_${i}.mp4`);

    const overlayFilter =
      overlay.type === "graph"
        ? `[1:v]scale=800:-1,format=rgba,fade=in:st=0:d=0.3:alpha=1,fade=out:st=${overlay.duration - 0.3}:d=0.3:alpha=1[ovr];[0:v][ovr]overlay=(W-w)/2:(H-h)/2:shortest=1:enable='between(t\\,${overlayStart.toFixed(3)}\\,${overlayEnd.toFixed(3)})'`
        : `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[ovr];[0:v][ovr]overlay=0:0:shortest=1:enable='between(t\\,${overlayStart.toFixed(3)}\\,${overlayEnd.toFixed(3)})'`;

    await ffmpeg([
      "-i", currentPath,
      "-i", overlay.filePath,
      "-filter_complex", overlayFilter,
      "-c:v", "h264_videotoolbox",
      "-b:v", "8M",
      "-c:a", "copy",
      "-y",
      overlayOutput,
    ], { timeout: 10 * 60 * 1000 });

    currentPath = overlayOutput;
  }

  // Step 3: Mix in SFX
  for (let i = 0; i < resolved.sfx.length; i++) {
    const sfx = resolved.sfx[i];
    if (!sfx.filePath) continue;

    const sfxTime = mapToConcatTime(sfx.at, edit.segmentsToKeep);
    if (sfxTime === null) continue;

    const sfxOutput = path.join(tmpDir, `sfx_${edit.id}_${i}.mp4`);

    await ffmpeg([
      "-i", currentPath,
      "-i", sfx.filePath,
      "-filter_complex",
      `[1:a]adelay=${Math.round(sfxTime * 1000)}|${Math.round(sfxTime * 1000)},volume=0.5[sfx];[0:a][sfx]amix=inputs=2:duration=first`,
      "-c:v", "copy",
      "-c:a", "aac",
      "-y",
      sfxOutput,
    ], { timeout: 10 * 60 * 1000 });

    currentPath = sfxOutput;
  }

  // Final: copy to output (no subtitles yet - Remotion handles that)
  if (currentPath !== outputPath) {
    await ffmpeg(["-i", currentPath, "-c", "copy", "-y", outputPath]);
  }

  console.log(`[edit] Done: ${outputPath}`);
  return outputPath;
}
