/**
 * FFmpeg editing module - cuts, trims, zooms, overlays b-roll/graphs, mixes SFX
 * Uses VideoToolbox hardware acceleration on Apple Silicon
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { ShortEdit, AssetIndex } from "./types.js";

const exec = promisify(execFile);

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
 * Handles: segment concatenation, zoom effects, b-roll/graph overlays
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

  // Step 3: Apply zoom on emphasis words
  // Calculate the cumulative time offset for each segment to map original timestamps
  // to concatenated timeline positions
  let zoomInput = "[vconcat]";
  let zoomCount = 0;
  edit.emphasisWords.forEach((ew) => {
    const concatTime = mapToConcatTime(ew.timestamp, edit.segmentsToKeep);
    if (concatTime === null) return;

    const zoomStart = concatTime;
    const zoomEnd = concatTime + (ew.duration || 0.5);
    const outLabel = `[vzoom${zoomCount}]`;

    // Smooth zoom in/out: scale up to 1.3x centered
    filters.push(
      `${zoomInput}zoompan=z='if(between(time,${zoomStart},${zoomEnd}),min(1.3,1+0.6*(time-${zoomStart})/${ew.duration || 0.5}),1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30${outLabel}`
    );
    zoomInput = outLabel;
    zoomCount++;
  });

  // If no zoom was applied, just pass through
  const finalVideo =
    zoomCount > 0
      ? `vzoom${zoomCount - 1}`
      : "vconcat";

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

  // Write filter to file (can be very long)
  const filterPath = path.join(tmpDir, `filter_${edit.id}.txt`);
  await writeFile(filterPath, filterComplex);

  // Step 1: Base cut with zoom
  await exec(
    "ffmpeg",
    [
      "-i", aRollPath,
      "-filter_complex_script", filterPath,
      ...outputMap,
      "-c:v", "h264_videotoolbox", // Apple Silicon HW encoding
      "-b:v", "8M",
      "-c:a", "aac",
      "-b:a", "192k",
      "-y",
      baseCutPath,
    ],
    { maxBuffer: 50 * 1024 * 1024, timeout: 30 * 60 * 1000 }
  );

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
    if (overlayStart === null) continue;

    const overlayOutput = path.join(tmpDir, `overlay_${edit.id}_${i}.mp4`);

    const overlayFilter =
      overlay.type === "graph"
        ? // Graph: scale to fit, center, with fade in/out
          `[1:v]scale=800:-1,format=rgba,fade=in:st=0:d=0.3:alpha=1,fade=out:st=${overlay.duration - 0.3}:d=0.3:alpha=1[ovr];[0:v][ovr]overlay=(W-w)/2:(H-h)/2:enable='between(t,${overlayStart},${overlayStart + overlay.duration})'`
        : // B-roll: full screen overlay with crossfade
          `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setpts=PTS-STARTPTS[ovr];[0:v][ovr]overlay=0:0:enable='between(t,${overlayStart},${overlayStart + overlay.duration})'`;

    await exec(
      "ffmpeg",
      [
        "-i", currentPath,
        "-i", overlay.filePath,
        "-filter_complex", overlayFilter,
        "-c:v", "h264_videotoolbox",
        "-b:v", "8M",
        "-c:a", "copy",
        "-y",
        overlayOutput,
      ],
      { maxBuffer: 50 * 1024 * 1024, timeout: 10 * 60 * 1000 }
    );

    currentPath = overlayOutput;
  }

  // Step 3: Mix in SFX
  for (let i = 0; i < resolved.sfx.length; i++) {
    const sfx = resolved.sfx[i];
    if (!sfx.filePath) continue;

    const sfxTime = mapToConcatTime(sfx.at, edit.segmentsToKeep);
    if (sfxTime === null) continue;

    const sfxOutput = path.join(tmpDir, `sfx_${edit.id}_${i}.mp4`);

    await exec(
      "ffmpeg",
      [
        "-i", currentPath,
        "-i", sfx.filePath,
        "-filter_complex",
        `[1:a]adelay=${Math.round(sfxTime * 1000)}|${Math.round(sfxTime * 1000)},volume=0.5[sfx];[0:a][sfx]amix=inputs=2:duration=first`,
        "-c:v", "copy",
        "-c:a", "aac",
        "-y",
        sfxOutput,
      ],
      { maxBuffer: 50 * 1024 * 1024, timeout: 10 * 60 * 1000 }
    );

    currentPath = sfxOutput;
  }

  // Final: copy to output (no subtitles yet - Remotion handles that)
  if (currentPath !== outputPath) {
    await exec("ffmpeg", ["-i", currentPath, "-c", "copy", "-y", outputPath]);
  }

  console.log(`[edit] Done: ${outputPath}`);
  return outputPath;
}
