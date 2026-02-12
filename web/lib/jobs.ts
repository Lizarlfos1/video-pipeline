import type { ChildProcess } from "node:child_process";

/** In-memory job store for pipeline processes (single-user local tool) */

interface Job {
  process: ChildProcess;
  logs: string[];
  status: "running" | "done" | "error";
  listeners: Set<(data: string) => void>;
}

const jobs = new Map<string, Job>();

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

export function createJob(jobId: string, process: ChildProcess): Job {
  const job: Job = {
    process,
    logs: [],
    status: "running",
    listeners: new Set(),
  };
  jobs.set(jobId, job);

  process.stdout?.on("data", (data: Buffer) => {
    const line = data.toString();
    job.logs.push(line);
    for (const fn of job.listeners) {
      fn(JSON.stringify({ type: "log", data: line }));
    }
  });

  process.stderr?.on("data", (data: Buffer) => {
    const line = data.toString();
    job.logs.push(line);
    for (const fn of job.listeners) {
      fn(JSON.stringify({ type: "log", data: line }));
    }
  });

  process.on("close", (code) => {
    job.status = code === 0 ? "done" : "error";
    for (const fn of job.listeners) {
      fn(JSON.stringify({ type: job.status }));
    }
  });

  return job;
}

export function addListener(
  jobId: string,
  fn: (data: string) => void
): () => void {
  const job = jobs.get(jobId);
  if (!job) return () => {};
  job.listeners.add(fn);
  return () => job.listeners.delete(fn);
}
