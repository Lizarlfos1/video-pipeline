import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { transcribe } from "@/lib/transcribe";
import { alignScriptToTranscript } from "@/lib/align";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 min for long videos

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const videoFile = formData.get("video") as File | null;
  const script = formData.get("script") as string | null;

  if (!videoFile || !script?.trim()) {
    return new Response(
      JSON.stringify({ error: "Video file and script are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create temp directory for this processing run
  const tmpDir = path.join(os.tmpdir(), `vidpipe-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  // Save uploaded video to temp
  const videoBytes = Buffer.from(await videoFile.arrayBuffer());
  const ext = path.extname(videoFile.name) || ".mp4";
  const videoPath = path.join(tmpDir, `input${ext}`);
  await writeFile(videoPath, videoBytes);

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        // Step 1: Transcribe
        send("status", { step: "transcribing", message: "Transcribing audio with Whisper..." });

        const transcript = await transcribe(videoPath, tmpDir);
        send("status", {
          step: "transcribed",
          message: `Transcribed ${transcript.segments.length} segments (${transcript.duration.toFixed(0)}s)`,
        });

        // Step 2: Align
        send("status", { step: "aligning", message: "Aligning script to transcript..." });

        const result = await alignScriptToTranscript(script, transcript);
        send("status", {
          step: "aligned",
          message: `Found ${result.shorts.length} shorts from ${result.metadata.scriptSections} script sections`,
        });

        // Step 3: Done - send results
        send("result", {
          shorts: result.shorts,
          metadata: result.metadata,
          transcript: {
            fullText: transcript.fullText,
            duration: transcript.duration,
            wordCount: transcript.segments.reduce((n, s) => n + s.words.length, 0),
          },
        });

        send("status", { step: "done", message: "Processing complete" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[process] Error:", err);
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
