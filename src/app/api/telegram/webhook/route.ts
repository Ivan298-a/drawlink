import { NextResponse, type NextRequest } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram-handler";
import type { TelegramUpdate } from "@/lib/telegram";

/**
 * Webhook от Telegram. Игнорирует ошибки внутри — отвечает 200 чтобы TG не ретраил.
 * Безопасность: secret_token в URL/headers можно добавить позже.
 */
export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
  } catch (e) {
    console.error("telegram webhook error:", e);
  }
  return NextResponse.json({ ok: true });
}
