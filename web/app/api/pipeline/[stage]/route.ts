import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PROJECT_ROOT } from "@/lib/paths";
import { createJob } from "@/lib/jobs";

const VALID_STAGES = new Set([
  "pull",
  "transcribe",
  "analyze",
  "edit",
  "subtitles",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stage: string }> }
) {
  const { stage } = await params;

  if (!VALID_STAGES.has(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const body = await request.json();
  const jobId = randomUUID();

  // Build CLI args
  const args = ["--env-file=.env", "src/cli.ts", stage];
  if (body.runId) args.push("--run-dir", path.join("runs", body.runId));
  if (body.shortId != null) args.push("--short", String(body.shortId));
  if (body.source) args.push(body.source);

  const child = spawn("npx", ["tsx", ...args], {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  createJob(jobId, child);

  return NextResponse.json({ jobId });
}
