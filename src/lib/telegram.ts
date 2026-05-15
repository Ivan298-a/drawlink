/**
 * Лёгкая обёртка над Telegram Bot API через fetch.
 * Без grammy и других libs — чтобы не раздувать bundle.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

export function telegramConfigured(): boolean {
  return Boolean(BOT_TOKEN && BOT_USERNAME);
}

export function botDeepLink(token: string): string {
  if (!BOT_USERNAME) return "";
  return `https://t.me/${BOT_USERNAME}?start=${token}`;
}

type TgSendMessageParams = {
  chatId: number | bigint;
  text: string;
  parseMode?: "MarkdownV2" | "HTML";
  disablePreview?: boolean;
  replyMarkup?: unknown;
};

export async function tgSendMessage(params: TgSendMessageParams): Promise<boolean> {
  if (!API_BASE) {
    console.warn("Telegram bot not configured — skipping message");
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: typeof params.chatId === "bigint" ? params.chatId.toString() : params.chatId,
        text: params.text,
        parse_mode: params.parseMode ?? "HTML",
        disable_web_page_preview: params.disablePreview ?? true,
        reply_markup: params.replyMarkup,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("Telegram sendMessage failed:", res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Telegram sendMessage error:", e);
    return false;
  }
}

/**
 * Экранирование для HTML parse_mode.
 */
export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Готовая ссылка-кнопка под сообщением.
 */
export function inlineButton(text: string, url: string) {
  return { inline_keyboard: [[{ text, url }]] };
}

/**
 * Update-объект от Telegram (минимально).
 */
export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string; username?: string };
    from?: { id: number; username?: string; first_name?: string };
    text?: string;
  };
};

/**
 * Установить webhook (используется один раз, при деплое).
 * Запуск: npm run bot:webhook https://your.app/api/telegram/webhook
 */
export async function setWebhook(url: string): Promise<boolean> {
  if (!API_BASE) return false;
  const res = await fetch(`${API_BASE}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message"] }),
  });
  if (!res.ok) {
    console.error("setWebhook failed:", await res.text().catch(() => res.statusText));
    return false;
  }
  return true;
}

/**
 * Получить обновления через long polling (для локальной разработки).
 */
export async function getUpdates(offset: number, timeout = 25): Promise<TelegramUpdate[]> {
  if (!API_BASE) return [];
  const res = await fetch(
    `${API_BASE}/getUpdates?offset=${offset}&timeout=${timeout}&allowed_updates=${encodeURIComponent('["message"]')}`,
    { method: "GET" }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
  return json.ok ? json.result : [];
}
