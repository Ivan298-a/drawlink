"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  confirmDeliverySchema,
  markDeliveredSchema,
  submitReviewSchema,
} from "@/lib/validation/deals";
import {
  notifyDealDelivered,
  notifyDealReleased,
  notifyNewChatMessage,
} from "@/lib/telegram-handler";
import { RATE_LIMIT_ERROR, checkMessageRateLimit } from "@/lib/rate-limit";

export type ActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string };

const sendMessageSchema = z.object({
  chatId: z.uuid(),
  body: z.string().trim().min(1, "Введите сообщение").max(4000, "Слишком длинно"),
});

export async function sendMessageAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await checkMessageRateLimit(user.id))) {
    return { ok: false, error: RATE_LIMIT_ERROR };
  }
  const parsed = sendMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }

  const { chatId, body } = parsed.data;

  // Доступ: только участник сделки
  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: { deal: { select: { buyerId: true, sellerId: true } } },
  });
  if (!chat) return { ok: false, error: "Чат не найден" };
  if (chat.deal.buyerId !== user.id && chat.deal.sellerId !== user.id) {
    return { ok: false, error: "Нет доступа" };
  }

  const message = await db.message.create({
    data: {
      chatId,
      senderId: user.id,
      body,
    },
  });

  // Уведомление противоположной стороне
  const recipientId =
    chat.deal.buyerId === user.id ? chat.deal.sellerId : chat.deal.buyerId;
  notifyNewChatMessage({
    recipientId,
    senderNickname: user.nickname,
    preview: body,
    dealId: chat.dealId,
  }).catch(() => {});

  revalidatePath(`/chats/${chat.dealId}`);
  revalidatePath("/chats");
  return { ok: true, data: { messageId: message.id } };
}

export async function markChatReadAction(chatId: string) {
  const user = await requireUser();
  await db.message.updateMany({
    where: {
      chatId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath("/chats");
}

/**
 * Исполнитель отмечает работу как готовую: указывает ключ файла в order-attachments.
 * Deal остаётся PAYMENT_HELD, но устанавливается autoReleaseAt = +72ч.
 * Связанный Order (если есть) переводится в REVIEW.
 */
export async function markDeliveredAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = markDeliveredSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }
  const { dealId, deliveredKey } = parsed.data;

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { chat: { select: { id: true } } },
  });
  if (!deal) return { ok: false, error: "Сделка не найдена" };
  if (deal.sellerId !== user.id) return { ok: false, error: "Только исполнитель может отметить" };
  if (deal.status !== "PAYMENT_HELD") {
    return { ok: false, error: "Сделка уже не активна" };
  }

  const autoReleaseAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await db.$transaction([
    db.deal.update({
      where: { id: dealId },
      data: {
        deliveredKey,
        deliveredAt: new Date(),
        autoReleaseAt,
      },
    }),
    ...(deal.orderId
      ? [
          db.order.update({
            where: { id: deal.orderId },
            data: { status: "REVIEW" },
          }),
        ]
      : []),
    ...(deal.chat
      ? [
          db.message.create({
            data: {
              chatId: deal.chat.id,
              senderId: user.id,
              body: "📦 Готовая работа загружена. У заказчика 72 часа на проверку.",
            },
          }),
        ]
      : []),
  ]);

  // Уведомление заказчику
  const orderCode = deal.orderId
    ? (await db.order.findUnique({ where: { id: deal.orderId }, select: { code: true } }))?.code
    : null;
  notifyDealDelivered({
    buyerId: deal.buyerId,
    orderCode: orderCode ?? "—",
    dealId,
  }).catch(() => {});

  revalidatePath(`/chats/${dealId}`);
  return { ok: true };
}

/**
 * Заказчик подтверждает работу: эскроу освобождается → seller получает payout.
 * Order переходит в COMPLETED. Создаётся уведомление в чате.
 */
export async function confirmDeliveryAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = confirmDeliverySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Ошибка" };
  const { dealId } = parsed.data;

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { chat: { select: { id: true } } },
  });
  if (!deal) return { ok: false, error: "Сделка не найдена" };
  if (deal.buyerId !== user.id) return { ok: false, error: "Только заказчик может подтвердить" };
  if (deal.status !== "PAYMENT_HELD") {
    return { ok: false, error: "Сделка уже не активна" };
  }

  await db.$transaction([
    db.deal.update({
      where: { id: dealId },
      data: { status: "RELEASED", releasedAt: new Date() },
    }),
    db.user.update({
      where: { id: deal.sellerId },
      data: { dealsCount: { increment: 1 } },
    }),
    ...(deal.orderId
      ? [
          db.order.update({
            where: { id: deal.orderId },
            data: { status: "COMPLETED", closedAt: new Date() },
          }),
        ]
      : []),
    ...(deal.chat
      ? [
          db.message.create({
            data: {
              chatId: deal.chat.id,
              senderId: user.id,
              body: "✅ Заказчик подтвердил работу. Платёж отправлен исполнителю.",
            },
          }),
        ]
      : []),
  ]);

  // Уведомление исполнителю о выплате
  const confirmOrderCode = deal.orderId
    ? (await db.order.findUnique({ where: { id: deal.orderId }, select: { code: true } }))?.code
    : null;
  notifyDealReleased({
    sellerId: deal.sellerId,
    payout: deal.payout,
    orderCode: confirmOrderCode ?? "—",
  }).catch(() => {});

  revalidatePath(`/chats/${dealId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Заказчик оставляет отзыв исполнителю. Только один отзыв на сделку.
 * Пересчитывает агрегаты ratingAvg/reviewsCount у получателя.
 */
export async function submitReviewAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = submitReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }
  const { dealId, ratingQuality, ratingSpeed, ratingComm, text } = parsed.data;

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { review: true },
  });
  if (!deal) return { ok: false, error: "Сделка не найдена" };
  if (deal.buyerId !== user.id) {
    return { ok: false, error: "Отзыв оставляет только заказчик" };
  }
  if (deal.status !== "RELEASED") {
    return { ok: false, error: "Сначала подтверди готовую работу" };
  }
  if (deal.review) {
    return { ok: false, error: "Отзыв уже оставлен" };
  }

  await db.review.create({
    data: {
      dealId,
      authorId: user.id,
      targetId: deal.sellerId,
      ratingQuality,
      ratingSpeed,
      ratingComm,
      text: text || null,
    },
  });

  // Пересчёт агрегатов
  const agg = await db.review.aggregate({
    where: { targetId: deal.sellerId },
    _avg: {
      ratingQuality: true,
      ratingSpeed: true,
      ratingComm: true,
    },
    _count: { _all: true },
  });
  const avgOverall =
    ((agg._avg.ratingQuality ?? 0) +
      (agg._avg.ratingSpeed ?? 0) +
      (agg._avg.ratingComm ?? 0)) /
    3;

  await db.user.update({
    where: { id: deal.sellerId },
    data: {
      ratingAvg: avgOverall.toFixed(2),
      reviewsCount: agg._count._all,
    },
  });

  // Получим nickname для точного revalidatePath
  const seller = await db.user.findUnique({
    where: { id: deal.sellerId },
    select: { nickname: true },
  });
  revalidatePath(`/chats/${dealId}`);
  if (seller) revalidatePath(`/u/${seller.nickname}`);
  return { ok: true };
}

/**
 * Возвращает signed URL для скачивания готового файла (deliveredKey).
 * Доступ — только buyer/seller сделки.
 */
export async function getDeliveredFileUrlAction(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { ok: false, error: "Сделка не найдена" };
  if (deal.buyerId !== user.id && deal.sellerId !== user.id) {
    return { ok: false, error: "Нет доступа" };
  }
  if (!deal.deliveredKey) return { ok: false, error: "Файл ещё не загружен" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from("order-attachments")
    .createSignedUrl(deal.deliveredKey, 15 * 60);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "Не удалось создать ссылку" };
  }
  return { ok: true, data: { url: data.signedUrl } };
}
