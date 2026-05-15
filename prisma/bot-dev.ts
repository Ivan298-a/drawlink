/**
 * Long-polling Telegram бот для локальной разработки.
 *
 * Запуск:
 *   npm run bot:dev
 *
 * В проде вместо этого используется webhook — POST на /api/telegram/webhook.
 * Установка webhook: npm run bot:webhook https://your-app/api/telegram/webhook
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

// Импорт после env, чтобы telegram.ts увидел токен
import { getUpdates, telegramConfigured } from "../src/lib/telegram";
import { handleTelegramUpdate } from "../src/lib/telegram-handler";

async function main() {
  if (!telegramConfigured()) {
    console.error(
      "❌ TELEGRAM_BOT_TOKEN и/или TELEGRAM_BOT_USERNAME не заданы в .env.local"
    );
    process.exit(1);
  }

  console.log("🤖 Бот запущен. Жду сообщений… (Ctrl+C для остановки)");

  let offset = 0;
  while (true) {
    try {
      const updates = await getUpdates(offset, 25);
      for (const u of updates) {
        try {
          await handleTelegramUpdate(u);
        } catch (e) {
          console.error("Update error:", e);
        }
        offset = u.update_id + 1;
      }
    } catch (e) {
      console.error("Poll error, retrying in 3s:", e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
