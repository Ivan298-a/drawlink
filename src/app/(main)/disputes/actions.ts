"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateDisputeCode } from "@/lib/orders/code";
import {
  addEvidenceSchema,
  openDisputeSchema,
  resolveDisputeSchema,
} from "@/lib/validation/disputes";
import { notifyDisputeOpened } from "@/lib/telegram-handler";
import { RATE_LIMIT_ERROR, checkDisputeRateLimit } from "@/lib/rate-limit";

export type ActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Открыть спор по активной сделке (PAYMENT_HELD).
 * Любая сторона может открыть. Deal переводится в DISPUTED, Order — в DISPUTED.
 * Auto-arbitrage таймер 24ч.
 */
export async function openDisputeAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await checkDisputeRateLimit(user.id))) {
    return { ok: false, error: RATE_LIMIT_ERROR };
  }
  const parsed = openDisputeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }
  const { dealId, category, reason } = parsed.data;

  const deal = await db.deal.findUnique({
    where: { id: dealId },
    include: { dispute: true, chat: { select: { id: true } } },
  });
  if (!deal) return { ok: false, error: "Сделка не найдена" };
  if (deal.buyerId !== user.id && deal.sellerId !== user.id) {
    return { ok: false, error: "Нет доступа" };
  }
  if (deal.status !== "PAYMENT_HELD") {
    return { ok: false, error: "Сделка не активна" };
  }
  if (deal.dispute) {
    return { ok: false, error: "Спор уже открыт" };
  }

  let code = generateDisputeCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db.dispute.findUnique({ where: { code } });
    if (!exists) break;
    code = generateDisputeCode();
  }

  const autoResolveAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const dispute = await db.$transaction(async (tx) => {
    const d = await tx.dispute.create({
      data: {
        code,
        dealId,
        openedById: user.id,
        category,
        reason,
        status: "OPEN",
        autoResolveAt,
      },
    });
    await tx.deal.update({
      where: { id: dealId },
      data: { status: "DISPUTED" },
    });
    if (deal.orderId) {
      await tx.order.update({
        where: { id: deal.orderId },
        data: { status: "DISPUTED" },
      });
    }
    if (deal.chat) {
      await tx.message.create({
        data: {
          chatId: deal.chat.id,
          senderId: user.id,
          body: `⚠ Открыт спор ${code}. Платёж заморожен до решения.`,
        },
      });
    }
    return d;
  });

  // Уведомление другой стороне
  const recipientId =
    deal.buyerId === user.id ? deal.sellerId : deal.buyerId;
  notifyDisputeOpened({
    recipientId,
    disputeCode: dispute.code,
    openedBy: user.nickname,
    reason,
  }).catch(() => {});

  revalidatePath(`/chats/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/disputes/${dispute.code}`);
}

/**
 * Добавить доказательство (текст + файлы из order-attachments) к открытому спору.
 */
export async function addEvidenceAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const attachmentKeys = formData.getAll("attachmentKeys").map(String);
  const parsed = addEvidenceSchema.safeParse({
    disputeId: formData.get("disputeId"),
    text: formData.get("text") ?? "",
    attachmentKeys,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }

  const dispute = await db.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { deal: { select: { buyerId: true, sellerId: true } } },
  });
  if (!dispute) return { ok: false, error: "Спор не найден" };
  if (
    dispute.deal.buyerId !== user.id &&
    dispute.deal.sellerId !== user.id &&
    user.role !== "ADMIN"
  ) {
    return { ok: false, error: "Нет доступа" };
  }
  if (dispute.status === "RESOLVED") {
    return { ok: false, error: "Спор уже закрыт" };
  }

  await db.evidence.create({
    data: {
      disputeId: dispute.id,
      addedById: user.id,
      text: parsed.data.text || null,
      attachments: parsed.data.attachmentKeys,
    },
  });

  revalidatePath(`/disputes/${dispute.code}`);
  return { ok: true };
}

/**
 * Применить решение по спору. Может вызвать:
 *  - открывший спор (если другая сторона согласна — тут упрощённо: применяет сразу)
 *  - админ (арбитраж)
 *
 * Логика payout:
 *  ACCEPT_WITH_REVISIONS — возвращаем Deal в PAYMENT_HELD, исполнитель доделывает (autoReleaseAt сбрасывается)
 *  PARTIAL_REFUND — buyer возвращается partialRefundAmount, остальное идёт seller, Deal → RELEASED
 *  FULL_REFUND — buyer возвращается amount полностью, Deal → REFUNDED
 */
export async function resolveDisputeAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = resolveDisputeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }
  const { disputeId, resolution, partialRefundAmount, note } = parsed.data;

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    include: {
      deal: {
        select: {
          id: true,
          buyerId: true,
          sellerId: true,
          amount: true,
          commission: true,
          payout: true,
          orderId: true,
          chat: { select: { id: true } },
        },
      },
    },
  });
  if (!dispute) return { ok: false, error: "Спор не найден" };
  if (
    dispute.deal.buyerId !== user.id &&
    dispute.deal.sellerId !== user.id &&
    user.role !== "ADMIN"
  ) {
    return { ok: false, error: "Нет доступа" };
  }
  if (dispute.status === "RESOLVED") {
    return { ok: false, error: "Спор уже закрыт" };
  }

  if (resolution === "PARTIAL_REFUND") {
    const partial = (partialRefundAmount ?? 0) * 100;
    if (partial <= 0 || partial >= dispute.deal.amount) {
      return { ok: false, error: "Некорректная сумма частичного возврата" };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolution,
        resolutionNote: note || null,
        resolvedAt: new Date(),
      },
    });

    if (resolution === "ACCEPT_WITH_REVISIONS") {
      // Возвращаем сделку в работу, сбрасываем autoReleaseAt
      await tx.deal.update({
        where: { id: dispute.deal.id },
        data: { status: "PAYMENT_HELD", autoReleaseAt: null },
      });
      if (dispute.deal.orderId) {
        await tx.order.update({
          where: { id: dispute.deal.orderId },
          data: { status: "IN_PROGRESS" },
        });
      }
    } else if (resolution === "FULL_REFUND") {
      await tx.deal.update({
        where: { id: dispute.deal.id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
      if (dispute.deal.orderId) {
        await tx.order.update({
          where: { id: dispute.deal.orderId },
          data: { status: "CANCELLED", closedAt: new Date() },
        });
      }
    } else if (resolution === "PARTIAL_REFUND") {
      // Сделка считается частично завершённой → RELEASED, seller получил часть
      await tx.deal.update({
        where: { id: dispute.deal.id },
        data: { status: "RELEASED", releasedAt: new Date() },
      });
      if (dispute.deal.orderId) {
        await tx.order.update({
          where: { id: dispute.deal.orderId },
          data: { status: "COMPLETED", closedAt: new Date() },
        });
      }
    }

    if (dispute.deal.chat) {
      const txt =
        resolution === "ACCEPT_WITH_REVISIONS"
          ? "✓ Спор закрыт: исполнитель доработает работу. Сделка возвращена в работу."
          : resolution === "FULL_REFUND"
            ? "✓ Спор закрыт: полный возврат заказчику. Сделка отменена."
            : "✓ Спор закрыт: частичный возврат заказчику. Сделка завершена.";
      await tx.message.create({
        data: {
          chatId: dispute.deal.chat.id,
          senderId: user.id,
          body: txt,
        },
      });
    }
  });

  revalidatePath(`/disputes/${dispute.code}`);
  revalidatePath(`/chats/${dispute.deal.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
