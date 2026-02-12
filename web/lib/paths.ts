import path from "node:path";

/** Project root is one level up from /web */
export const PROJECT_ROOT = path.resolve(process.cwd(), "..");
export const RUNS_DIR = path.join(PROJECT_ROOT, "runs");
export const ASSETS_DIR = path.join(PROJECT_ROOT, "assets");

/** Validate a path is within the project root (prevent directory traversal) */
export function validatePath(relativePath: string): string | null {
  const absolute = path.resolve(PROJECT_ROOT, relativePath);
  if (!absolute.startsWith(PROJECT_ROOT)) return null;
  return absolute;
}
