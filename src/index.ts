/**
 * Entry point - starts the Telegram bot and waits for /process commands
 */

import { initBot } from "./bot.js";
import { runPipeline } from "./orchestrator.js";

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  GOOGLE_DRIVE_BROLL_FOLDER_ID,
  GOOGLE_DRIVE_GRAPHS_FOLDER_ID,
  GOOGLE_DRIVE_SFX_FOLDER_ID,
  GOOGLE_DRIVE_COMPLETED_FOLDER_ID,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  process.exit(1);
}

if (
  !GOOGLE_DRIVE_BROLL_FOLDER_ID ||
  !GOOGLE_DRIVE_GRAPHS_FOLDER_ID ||
  !GOOGLE_DRIVE_SFX_FOLDER_ID ||
  !GOOGLE_DRIVE_COMPLETED_FOLDER_ID
) {
  console.error("Missing Google Drive folder IDs in .env");
  process.exit(1);
}

console.log("=== Video Pipeline Server ===");
console.log("Waiting for Telegram commands...");
console.log("Send /process <a-roll-file-id> to start");
console.log("");

initBot(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, async (aRollFileId) => {
  try {
    await runPipeline({
      aRollFileId,
      bRollFolderId: GOOGLE_DRIVE_BROLL_FOLDER_ID!,
      graphsFolderId: GOOGLE_DRIVE_GRAPHS_FOLDER_ID!,
      sfxFolderId: GOOGLE_DRIVE_SFX_FOLDER_ID!,
      completedFolderId: GOOGLE_DRIVE_COMPLETED_FOLDER_ID!,
    });
  } catch (err) {
    console.error("Pipeline run failed:", err);
  }
});
