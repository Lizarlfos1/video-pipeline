import type {
  RunInfo,
  Transcript,
  AssetIndex,
  ShortEdit,
  PipelineStage,
} from "./types";

const BASE = "/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// Runs
export async function listRuns(): Promise<RunInfo[]> {
  return fetchJson(`${BASE}/runs`);
}

export async function getTranscript(runId: string): Promise<Transcript> {
  return fetchJson(`${BASE}/runs/${runId}/transcript`);
}

export async function getAssets(runId: string): Promise<AssetIndex> {
  return fetchJson(`${BASE}/runs/${runId}/assets`);
}

export async function getEdits(runId: string): Promise<ShortEdit[]> {
  return fetchJson(`${BASE}/runs/${runId}/edits`);
}

export async function saveEdits(
  runId: string,
  shorts: ShortEdit[]
): Promise<void> {
  await fetchJson(`${BASE}/runs/${runId}/edits`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shorts),
  });
}

// Media URL builder
export function mediaUrl(relativePath: string): string {
  return `${BASE}/media?path=${encodeURIComponent(relativePath)}`;
}

// Pipeline
export async function triggerPipeline(
  stage: PipelineStage,
  body: Record<string, unknown>
): Promise<{ jobId: string }> {
  return fetchJson(`${BASE}/pipeline/${stage}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function pipelineStreamUrl(
  stage: PipelineStage,
  jobId: string
): string {
  return `${BASE}/pipeline/${stage}/stream?jobId=${jobId}`;
}
