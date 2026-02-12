/**
 * Subtitle rendering module - uses Remotion to create animated captions
 * Renders a transparent overlay video with word-by-word animated subtitles
 * Then composites onto the edited short via FFmpeg
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { WordTimestamp } from "./types.js";

const exec = promisify(execFile);

/**
 * Generate the Remotion props file for a short's subtitles
 */
async function writeSubtitleProps(
  words: WordTimestamp[],
  durationInSeconds: number,
  propsPath: string
): Promise<void> {
  const props = {
    words: words.map((w) => ({
      word: w.word,
      startFrame: Math.round(w.start * 30), // 30fps
      endFrame: Math.round(w.end * 30),
    })),
    durationInFrames: Math.ceil(durationInSeconds * 30),
    fps: 30,
    width: 1080,
    height: 1920,
  };
  await writeFile(propsPath, JSON.stringify(props));
}

/**
 * Render subtitles overlay using Remotion CLI, then composite onto video
 */
export async function addSubtitles(
  videoPath: string,
  words: WordTimestamp[],
  durationInSeconds: number,
  outputPath: string,
  tmpDir: string
): Promise<string> {
  console.log(`[subtitles] Rendering animated captions for ${path.basename(videoPath)} (${words.length} words)...`);

  const propsPath = path.join(tmpDir, "subtitle-props.json");
  await writeSubtitleProps(words, durationInSeconds, propsPath);

  const subtitleVideoPath = path.join(tmpDir, "subtitles-overlay.webm");
  const remotionDir = path.join(process.cwd(), "remotion");

  // Render subtitle overlay with transparent background
  // --pixel-format yuva420p is critical for VP9 alpha channel
  await exec(
    "npx",
    [
      "remotion",
      "render",
      path.join(remotionDir, "index.ts"),
      "Subtitles",
      subtitleVideoPath,
      "--props", propsPath,
      "--codec", "vp9",
      "--image-format", "png",
      "--pixel-format", "yuva420p",
      "--concurrency", "4",
    ],
    { maxBuffer: 50 * 1024 * 1024, timeout: 30 * 60 * 1000, cwd: remotionDir }
  );

  // Composite subtitle overlay onto the video
  console.log("[subtitles] Compositing subtitles onto video...");
  await exec(
    "ffmpeg",
    [
      "-i", videoPath,
      "-c:v", "libvpx-vp9",
      "-i", subtitleVideoPath,
      "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=1",
      "-c:v", "h264_videotoolbox",
      "-b:v", "8M",
      "-c:a", "copy",
      "-y",
      outputPath,
    ],
    { maxBuffer: 50 * 1024 * 1024, timeout: 10 * 60 * 1000 }
  );

  console.log(`[subtitles] Done: ${outputPath}`);
  return outputPath;
}
