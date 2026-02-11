/**
 * Google Drive module - pulls assets and uploads completed shorts
 */

import { google } from "googleapis";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
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
 * Download a file from Google Drive to local path
 */
async function downloadFile(
  fileId: string,
  destPath: string
): Promise<void> {
  const drive = await getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  await writeFile(destPath, Buffer.from(res.data as ArrayBuffer));
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

  // B-roll
  const brollFiles = await listFolder(bRollFolderId);
  for (const f of brollFiles) {
    const localPath = path.join(brollDir, f.name);
    await downloadFile(f.id, localPath);
    // Label is the filename without extension
    const label = path.parse(f.name).name;
    index.broll.push({ label, path: localPath });
    console.log(`  [drive] B-roll: ${label}`);
  }

  // Graphs
  const graphFiles = await listFolder(graphsFolderId);
  for (const f of graphFiles) {
    const localPath = path.join(graphsDir, f.name);
    await downloadFile(f.id, localPath);
    const label = path.parse(f.name).name;
    index.graphs.push({ label, path: localPath });
    console.log(`  [drive] Graph: ${label}`);
  }

  // SFX
  const sfxFiles = await listFolder(sfxFolderId);
  for (const f of sfxFiles) {
    const localPath = path.join(sfxDir, f.name);
    await downloadFile(f.id, localPath);
    const label = path.parse(f.name).name;
    index.sfx.push({ label, path: localPath });
    console.log(`  [drive] SFX: ${label}`);
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

/**
 * Upload a completed short back to Google Drive
 */
export async function uploadCompleted(
  localPath: string,
  completedFolderId: string
): Promise<string> {
  const drive = await getDrive();
  const fileName = path.basename(localPath);

  console.log(`[drive] Uploading ${fileName} to completed folder...`);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [completedFolderId],
    },
    media: {
      mimeType: "video/mp4",
      body: (await import("node:fs")).createReadStream(localPath),
    },
    fields: "id, webViewLink",
  });

  console.log(`[drive] Uploaded: ${res.data.webViewLink}`);
  return res.data.webViewLink ?? res.data.id ?? "";
}
