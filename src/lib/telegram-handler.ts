/**
 * Обработка одного апдейта от Telegram. Используется как webhook'ом,
 * так и скриптом long polling — единая точка логики.
 */
import { db } from "@/lib/db";
import { escapeHtml, inlineButton, tgSendMessage, type TelegramUpdate } from "@/lib/telegram";

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg?.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // /start <token>
  if (text.startsWith("/start")) {
    const parts = text.split(/\s+/);
    const token = parts[1];

    if (!token) {
      await tgSendMessage({
        chatId,
        text: [
          "👋 Это бот <b>DrawLink</b>.",
          "",
          "Чтобы подключить уведомления, открой настройки на сайте → «Telegram» → «Подключить».",
        ].join("\n"),
      });
      return;
    }

    const user = await db.user.findUnique({
      where: { telegramConnectToken: token },
    });
    if (
      !user ||
      !user.telegramConnectExpiresAt ||
      user.telegramConnectExpiresAt.getTime() < Date.now()
    ) {
      await tgSendMessage({
        chatId,
        text:
          "⚠ Токен недействителен или истёк. Запроси новый в настройках на сайте.",
      });
      return;
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: BigInt(chatId),
        telegramUsername: msg.from?.username ?? null,
        telegramConnectToken: null,
        telegramConnectExpiresAt: null,
      },
    });

    await tgSendMessage({
      chatId,
      text: [
        `✅ Привет, <b>${escapeHtml(user.nickname)}</b>!`,
        "",
        "Telegram подключён. Теперь я буду присылать сюда:",
        "• новые отклики на твои заказы",
        "• сообщения в активных сделках",
        "• уведомления о спорах и платежах",
        "",
        "Чтобы отключить — настройки на сайте.",
      ].join("\n"),
    });
    return;
  }

  if (text === "/help" || text === "/start@help") {
    await tgSendMessage({
      chatId,
      text: [
        "<b>DrawLink — бот уведомлений</b>",
        "",
        "Команды:",
        "/status — проверить связь",
        "/disconnect — отключить уведомления",
        "",
        "Все действия с заказами и платежами — на сайте.",
      ].join("\n"),
    });
    return;
  }

  if (text === "/status") {
    const user = await db.user.findUnique({
      where: { telegramChatId: BigInt(chatId) },
    });
    if (user) {
      await tgSendMessage({
        chatId,
        text: `✓ Подключено как <b>${escapeHtml(user.nickname)}</b>. Уведомления ${user.notifyTelegram ? "включены" : "выключены"}.`,
      });
    } else {
      await tgSendMessage({
        chatId,
        text: "Не подключено. Нажми «Подключить Telegram» в настройках сайта.",
      });
    }
    return;
  }

  if (text === "/disconnect") {
    const user = await db.user.findUnique({
      where: { telegramChatId: BigInt(chatId) },
    });
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { telegramChatId: null, telegramUsername: null },
      });
      await tgSendMessage({
        chatId,
        text: "Telegram отключён. Включить заново можно в настройках на сайте.",
      });
    } else {
      await tgSendMessage({ chatId, text: "Аккаунт не подключён." });
    }
    return;
  }

  // Любой другой текст — короткий ответ
  await tgSendMessage({
    chatId,
    text:
      "Я только присылаю уведомления. Все действия — на сайте: " +
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://drawlink.app"),
  });
}

/* ============= ВСПОМОГАТЕЛЬНЫЕ NOTIFY-ХЕЛПЕРЫ ============= */

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function notifyUser(
  userId: string,
  text: string,
  buttonText?: string,
  buttonPath?: string
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true, notifyTelegram: true },
  });
  if (!user?.telegramChatId || !user.notifyTelegram) return;
  await tgSendMessage({
    chatId: user.telegramChatId,
    text,
    replyMarkup: buttonText && buttonPath
      ? inlineButton(buttonText, `${appUrl()}${buttonPath}`)
      : undefined,
  });
}

export async function notifyNewOffer(opts: {
  studentId: string;
  orderCode: string;
  orderTitle: string;
  executorNickname: string;
  price: number; // копейки
}): Promise<void> {
  const rub = new Intl.NumberFormat("ru-RU").format(Math.round(opts.price / 100));
  await notifyUser(
    opts.studentId,
    [
      "💬 <b>Новый отклик</b>",
      `<code>${opts.orderCode}</code> · ${escapeHtml(opts.orderTitle)}`,
      "",
      `Исполнитель: <b>${escapeHtml(opts.executorNickname)}</b>`,
      `Цена: ${rub} ₽`,
    ].join("\n"),
    "Открыть заказ",
    `/orders/${opts.orderCode}`
  );
}

export async function notifyOfferAccepted(opts: {
  executorId: string;
  orderCode: string;
  orderTitle: string;
}): Promise<void> {
  await notifyUser(
    opts.executorId,
    [
      "🎉 <b>Твой отклик выбран!</b>",
      `<code>${opts.orderCode}</code> · ${escapeHtml(opts.orderTitle)}`,
      "",
      "Платёж заморожен на платформе. Можно приступать к работе.",
    ].join("\n"),
    "Открыть чат",
    `/chats`
  );
}

export async function notifyNewChatMessage(opts: {
  recipientId: string;
  senderNickname: string;
  preview: string;
  dealId: string;
}): Promise<void> {
  const trimmed =
    opts.preview.length > 120
      ? opts.preview.slice(0, 120) + "…"
      : opts.preview;
  await notifyUser(
    opts.recipientId,
    [
      `💬 <b>${escapeHtml(opts.senderNickname)}</b>`,
      escapeHtml(trimmed),
    ].join("\n"),
    "Открыть чат",
    `/chats/${opts.dealId}`
  );
}

export async function notifyDisputeOpened(opts: {
  recipientId: string;
  disputeCode: string;
  openedBy: string;
  reason: string;
}): Promise<void> {
  await notifyUser(
    opts.recipientId,
    [
      "⚠ <b>Открыт спор</b>",
      `<code>${opts.disputeCode}</code>`,
      "",
      `Открыл: <b>${escapeHtml(opts.openedBy)}</b>`,
      `Причина: ${escapeHtml(opts.reason.slice(0, 200))}${opts.reason.length > 200 ? "…" : ""}`,
    ].join("\n"),
    "Открыть спор",
    `/disputes/${opts.disputeCode}`
  );
}

export async function notifyDealDelivered(opts: {
  buyerId: string;
  orderCode: string;
  dealId: string;
}): Promise<void> {
  await notifyUser(
    opts.buyerId,
    [
      "📦 <b>Готовая работа загружена</b>",
      `<code>${opts.orderCode}</code>`,
      "",
      "У тебя 72 часа на проверку. После — платёж автоматически уйдёт исполнителю.",
    ].join("\n"),
    "Проверить работу",
    `/chats/${opts.dealId}`
  );
}

export async function notifyDealReleased(opts: {
  sellerId: string;
  payout: number;
  orderCode: string;
}): Promise<void> {
  const rub = new Intl.NumberFormat("ru-RU").format(Math.round(opts.payout / 100));
  await notifyUser(
    opts.sellerId,
    [
      "✅ <b>Платёж зачислен</b>",
      `<code>${opts.orderCode}</code>`,
      "",
      `Тебе зачислено: <b>${rub} ₽</b>`,
    ].join("\n"),
    "Запросить выплату",
    `/dashboard`
  );
}
