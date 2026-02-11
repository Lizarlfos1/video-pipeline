/**
 * Pipeline orchestrator - runs the full edit pipeline for a given a-roll file
 *
 * Flow:
 * 1. Pull a-roll + assets from Google Drive
 * 2. Transcribe with whisper.cpp
 * 3. Send transcript to Claude for edit decisions
 * 4. Render each short with FFmpeg (cut, zoom, overlays, sfx)
 * 5. Add animated subtitles with Remotion
 * 6. Upload completed shorts back to Drive
 */

import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { transcribe } from "./transcribe.js";
import { analyzeTranscript } from "./analyze.js";
import { renderShort } from "./edit.js";
import { addSubtitles } from "./subtitles.js";
import { pullARoll, pullAssets, uploadCompleted } from "./drive.js";
import { notify } from "./bot.js";

interface PipelineOptions {
  aRollFileId: string;
  bRollFolderId: string;
  graphsFolderId: string;
  sfxFolderId: string;
  completedFolderId: string;
}

export async function runPipeline(opts: PipelineOptions): Promise<void> {
  const runId = Date.now().toString(36);
  const tmpDir = path.join(process.cwd(), "tmp", runId);
  const outputDir = path.join(process.cwd(), "output", runId);
  const assetsDir = path.join(process.cwd(), "assets");

  await mkdir(tmpDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  try {
    // Step 1: Pull from Drive (assets cached in persistent dir, a-roll always fresh)
    await notify("📥 Downloading a-roll and syncing assets from Drive...");
    const [aRollPath, assets] = await Promise.all([
      pullARoll(opts.aRollFileId, tmpDir),
      pullAssets(opts.bRollFolderId, opts.graphsFolderId, opts.sfxFolderId, assetsDir),
    ]);

    // Step 2: Transcribe
    await notify("🎙️ Transcribing audio (this takes a while)...");
    const transcript = await transcribe(aRollPath, tmpDir);
    await notify(
      `✅ Transcription done: ${transcript.segments.length} segments, ${Math.round(transcript.duration / 60)}min`
    );

    // Step 3: Analyze with Claude
    await notify("🧠 Analyzing transcript with Claude...");
    const edits = await analyzeTranscript(transcript, assets);
    await notify(`✅ Claude found ${edits.length} shorts to create`);

    // Step 4 + 5: Render each short (sequential to avoid overloading the M2)
    const completedPaths: string[] = [];
    const failed: { id: number; title: string; error: string }[] = [];

    for (const edit of edits) {
      try {
        await notify(`🎬 Rendering short #${edit.id}: "${edit.title}"...`);

        // 4a: FFmpeg edit (cut, zoom, overlays, sfx)
        const editedPath = await renderShort(
          aRollPath,
          edit,
          assets,
          outputDir,
          tmpDir
        );

        // 4b: Calculate duration of the concatenated short
        const totalDuration = edit.segmentsToKeep.reduce(
          (sum, seg) => sum + (seg.end - seg.start),
          0
        );

        // 5: Add Remotion subtitles
        const finalPath = path.join(
          outputDir,
          `final_${edit.id}_${edit.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`
        );
        await addSubtitles(
          editedPath,
          edit.subtitleWords,
          totalDuration,
          finalPath,
          tmpDir
        );

        completedPaths.push(finalPath);
        await notify(`✅ Short #${edit.id} rendered`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[orchestrator] Short #${edit.id} failed:`, msg);
        await notify(`⚠️ Short #${edit.id} "${edit.title}" failed, skipping: ${msg.slice(0, 200)}`);
        failed.push({ id: edit.id, title: edit.title, error: msg.slice(0, 200) });
      }
    }

    // Step 6: Upload to Drive
    if (completedPaths.length === 0) {
      await notify(`❌ All ${edits.length} shorts failed to render. Check logs for details.`);
      return;
    }
    await notify(`📤 Uploading ${completedPaths.length} completed shorts to Drive...`);
    const links: string[] = [];
    for (const p of completedPaths) {
      const link = await uploadCompleted(p, opts.completedFolderId);
      links.push(link);
    }

    let summary = `🎉 Done! ${completedPaths.length} shorts uploaded:\n${links.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;
    if (failed.length > 0) {
      summary += `\n\n⚠️ ${failed.length} short(s) failed:\n${failed.map((f) => `#${f.id} "${f.title}": ${f.error}`).join("\n")}`;
    }
    await notify(summary);

    // Cleanup tmp files
    await rm(tmpDir, { recursive: true, force: true });
    console.log("[orchestrator] Pipeline complete, tmp cleaned up");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[orchestrator] Pipeline failed:", message);
    await notify(`❌ Pipeline failed: ${message}`);
    throw err;
  }
}
