import { NextRequest } from "next/server";
import { getJob, addListener } from "@/lib/jobs";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return new Response("Missing jobId", { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send existing logs
      for (const log of job.logs) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "log", data: log })}\n\n`)
        );
      }

      // If already finished, send final status
      if (job.status !== "running") {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: job.status })}\n\n`)
        );
        controller.close();
        return;
      }

      // Listen for new events
      const cleanup = addListener(jobId, (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          const parsed = JSON.parse(data);
          if (parsed.type === "done" || parsed.type === "error") {
            controller.close();
            cleanup();
          }
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "log", data })}\n\n`)
          );
        }
      });
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
