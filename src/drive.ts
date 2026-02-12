/**
 * Google Drive module - pulls a-roll and syncs assets
 */

import { google } from "googleapis";
import { createWriteStream } from "node:fs";
import { readFile, mkdir, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import type { AssetIndex } from "./types.js";

const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "credentials",
  "google-service-account.json"
);

async function getAuth() {
  const keyFile = JSON.parse(await readFile(CREDENTIALS_PATH, "utf-8"));
  return new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

async function getDrive() {
  const auth = await getAuth();
  return google.drive({ version: "v3", auth });
}

/**
 * List all files in a Google Drive folder
 */
async function listFolder(
  folderId: string
): Promise<{ name: string; id: string; mimeType: string }[]> {
  const drive = await getDrive();
  const files: { name: string; id: string; mimeType: string }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageToken,
    });

    for (const f of res.data.files ?? []) {
      if (f.name && f.id && f.mimeType) {
        files.push({ name: f.name, id: f.id, mimeType: f.mimeType });
      }
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

/**
 * Download a file from Google Drive to local path (streaming for large files)
 */
async function downloadFile(
  fileId: string,
  destPath: string
): Promise<void> {
  const drive = await getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  const dest = createWriteStream(destPath);
  await pipeline(res.data as Readable, dest);
}

/**
 * Download all assets from Drive into local directories and build an index
 */
export async function pullAssets(
  bRollFolderId: string,
  graphsFolderId: string,
  sfxFolderId: string,
  localBaseDir: string
): Promise<AssetIndex> {
  const brollDir = path.join(localBaseDir, "broll");
  const graphsDir = path.join(localBaseDir, "graphs");
  const sfxDir = path.join(localBaseDir, "sfx");

  await mkdir(brollDir, { recursive: true });
  await mkdir(graphsDir, { recursive: true });
  await mkdir(sfxDir, { recursive: true });

  console.log("[drive] Pulling assets from Google Drive...");

  const index: AssetIndex = { broll: [], graphs: [], sfx: [] };

  // Skip Google-native files (Docs, Sheets, etc.) that can't be downloaded as binary
  const isDownloadable = (mimeType: string) =>
    !mimeType.startsWith("application/vnd.google-apps.");

  async function downloadIfNew(fileId: string, destPath: string, label: string) {
    try {
      await stat(destPath);
      console.log(`  [drive] Cached: ${label}`);
    } catch {
      await downloadFile(fileId, destPath);
      console.log(`  [drive] Downloaded: ${label}`);
    }
  }

  // B-roll (supports subfolders — folder name becomes label, first file inside is used)
  const isFolder = (mimeType: string) => mimeType === "application/vnd.google-apps.folder";
  const brollFiles = await listFolder(bRollFolderId);
  for (const f of brollFiles) {
    if (isFolder(f.mimeType)) {
      // Recurse into subfolder — use folder name as label, download first video
      const subFiles = await listFolder(f.id);
      const firstVideo = subFiles.find((sf) => isDownloadable(sf.mimeType));
      if (!firstVideo) continue;
      const subDir = path.join(brollDir, f.name);
      await mkdir(subDir, { recursive: true });
      const localPath = path.join(subDir, firstVideo.name);
      await downloadIfNew(firstVideo.id, localPath, `B-roll: ${f.name}`);
      index.broll.push({ label: f.name, path: localPath });
    } else if (isDownloadable(f.mimeType)) {
      const localPath = path.join(brollDir, f.name);
      const label = path.parse(f.name).name;
      await downloadIfNew(f.id, localPath, `B-roll: ${label}`);
      index.broll.push({ label, path: localPath });
    }
  }

  // Graphs
  const graphFiles = await listFolder(graphsFolderId);
  for (const f of graphFiles) {
    if (!isDownloadable(f.mimeType)) {
      console.log(`  [drive] Skipping non-binary file: ${f.name} (${f.mimeType})`);
      continue;
    }
    const localPath = path.join(graphsDir, f.name);
    const label = path.parse(f.name).name;
    await downloadIfNew(f.id, localPath, `Graph: ${label}`);
    index.graphs.push({ label, path: localPath });
  }

  // SFX
  const sfxFiles = await listFolder(sfxFolderId);
  for (const f of sfxFiles) {
    if (!isDownloadable(f.mimeType)) {
      console.log(`  [drive] Skipping non-binary file: ${f.name} (${f.mimeType})`);
      continue;
    }
    const localPath = path.join(sfxDir, f.name);
    const label = path.parse(f.name).name;
    await downloadIfNew(f.id, localPath, `SFX: ${label}`);
    index.sfx.push({ label, path: localPath });
  }

  console.log(
    `[drive] Pulled ${index.broll.length} b-roll, ${index.graphs.length} graphs, ${index.sfx.length} sfx`
  );
  return index;
}

/**
 * Download the a-roll file from Drive
 */
export async function pullARoll(
  fileId: string,
  localDir: string
): Promise<string> {
  const drive = await getDrive();
  const meta = await drive.files.get({ fileId, fields: "name" });
  const name = meta.data.name ?? "a-roll.mp4";
  const localPath = path.join(localDir, name);

  console.log(`[drive] Downloading a-roll: ${name}...`);
  await downloadFile(fileId, localPath);
  console.log(`[drive] A-roll saved to ${localPath}`);

  return localPath;
}
