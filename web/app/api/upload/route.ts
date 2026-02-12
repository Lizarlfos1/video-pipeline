import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { RUNS_DIR } from "@/lib/paths";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const script = formData.get("script") as string | null;

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }
    if (!script || script.trim().length === 0) {
      return NextResponse.json({ error: "No script provided" }, { status: 400 });
    }

    // Create timestamped run directory
    const now = new Date();
    const stamp = now
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "")
      .replace(/\..+/, "")
      .slice(0, 15);
    const runDir = path.join(RUNS_DIR, stamp);

    await mkdir(runDir, { recursive: true });
    await mkdir(path.join(runDir, "shorts"), { recursive: true });
    await mkdir(path.join(runDir, "finals"), { recursive: true });
    await mkdir(path.join(runDir, "tmp"), { recursive: true });

    // Stream video to disk
    const aRollPath = path.join(runDir, "a-roll.mp4");
    const fileStream = videoFile.stream();
    const writeStream = createWriteStream(aRollPath);
    const nodeStream = Readable.fromWeb(fileStream as any);
    await pipeline(nodeStream, writeStream);

    // Save script
    await writeFile(path.join(runDir, "script.txt"), script);

    // Write empty assets.json (no Drive pull in upload flow)
    await writeFile(
      path.join(runDir, "assets.json"),
      JSON.stringify({ broll: [], graphs: [], sfx: [] }, null, 2),
    );

    console.log(`[upload] Created run ${stamp} — video: ${(videoFile.size / 1024 / 1024).toFixed(1)}MB`);

    return NextResponse.json({ runId: stamp });
  } catch (err: any) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 },
    );
  }
}
