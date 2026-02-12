import { NextRequest } from "next/server";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, validatePath } from "@/lib/paths";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".json": "application/json",
};

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) {
    return new Response("Missing path parameter", { status: 400 });
  }

  const absolutePath = validatePath(filePath);
  if (!absolutePath) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const fileStat = await stat(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace("bytes=", "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(absolutePath, { start, end });
      const readable = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => {
            if (typeof chunk === "string") {
              controller.enqueue(new TextEncoder().encode(chunk));
            } else {
              controller.enqueue(new Uint8Array(chunk));
            }
          });
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
      });

      return new Response(readable, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }

    const stream = createReadStream(absolutePath);
    const readable = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          if (typeof chunk === "string") {
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            controller.enqueue(new Uint8Array(chunk));
          }
        });
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Length": String(fileStat.size),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
