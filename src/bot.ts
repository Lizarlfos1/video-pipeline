/**
 * Telegram bot module - listens for commands and sends status updates
 */

import TelegramBot from "node-telegram-bot-api";

let bot: TelegramBot | null = null;
let chatId: string | null = null;

export function initBot(
  token: string,
  allowedChatId: string,
  onProcess: (aRollFileId: string, message: TelegramBot.Message) => void
): TelegramBot {
  bot = new TelegramBot(token, { polling: true });
  chatId = allowedChatId;

  bot.onText(/\/process (.+)/, (msg, match) => {
    if (msg.chat.id.toString() !== allowedChatId) {
      bot!.sendMessage(msg.chat.id, "Unauthorized.");
      return;
    }

    const aRollFileId = match?.[1]?.trim();
    if (!aRollFileId) {
      bot!.sendMessage(msg.chat.id, "Usage: /process <google_drive_file_id>");
      return;
    }

    bot!.sendMessage(msg.chat.id, "Starting pipeline... I'll update you as I go.");
    onProcess(aRollFileId, msg);
  });

  bot.onText(/\/status/, (msg) => {
    if (msg.chat.id.toString() !== allowedChatId) return;
    bot!.sendMessage(msg.chat.id, "Bot is running and ready.");
  });

  console.log("[bot] Telegram bot started, listening for /process commands");
  return bot;
}

export async function notify(message: string): Promise<void> {
  if (!bot || !chatId) return;
  await bot.sendMessage(chatId, message);
}

export async function sendVideo(
  videoPath: string,
  caption: string
): Promise<void> {
  if (!bot || !chatId) return;
  await bot.sendVideo(chatId, videoPath, { caption });
}
