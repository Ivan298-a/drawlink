"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateOrderCode } from "@/lib/orders/code";
import { createOfferSchema, createOrderSchema } from "@/lib/validation/orders";
import { notifyNewOffer, notifyOfferAccepted } from "@/lib/telegram-handler";
import {
  RATE_LIMIT_ERROR,
  checkOfferRateLimit,
  checkOrderRateLimit,
} from "@/lib/rate-limit";

export type ActionResult =
  | { ok: true; redirect?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function collectFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createOrderAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser("/orders/new");

  if (!(await checkOrderRateLimit(user.id))) {
    return { ok: false, error: RATE_LIMIT_ERROR };
  }

  // fileFormats — multi-select, нужно собрать все значения
  const formats = formData.getAll("fileFormats").map(String);
  const raw = { ...Object.fromEntries(formData), fileFormats: formats };

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Проверьте поля формы",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  // budget пришёл в рублях — храним в копейках
  const budgetKopecks = data.budget * 100;

  // Авто-логика: для бумаги нужен исполнитель из того же города
  const allowSameCity = data.deliveryType === "DIGITAL_AND_PAPER";

  // Retry на случай collision кода (вероятность ~0)
  let code = generateOrderCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await db.order.findUnique({ where: { code } });
    if (!exists) break;
    code = generateOrderCode();
  }

  const order = await db.order.create({
    data: {
      code,
      studentId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      fileFormats: data.fileFormats,
      deliveryType: data.deliveryType,
      paperSize: data.paperSize,
      standard: data.standard,
      budget: budgetKopecks,
      deadline: data.deadline,
      allowSameCity,
      status: "OPEN",
      publishedAt: new Date(),
    },
  });

  revalidatePath("/orders");
  redirect(`/orders/${order.code}`);
}

export async function submitOfferAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "EXECUTOR" && user.role !== "ADMIN") {
    return { ok: false, error: "Только исполнители могут откликаться" };
  }
  if (!(await checkOfferRateLimit(user.id))) {
    return { ok: false, error: RATE_LIMIT_ERROR };
  }

  const parsed = createOfferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Проверьте поля формы",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }
  const { orderId, price, message, etaDays } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "OPEN") {
    return { ok: false, error: "Заказ недоступен" };
  }
  if (order.studentId === user.id) {
    return { ok: false, error: "Нельзя откликаться на свой заказ" };
  }

  // Проверка фильтра города (если заказ не allowSameCity)
  if (!order.allowSameCity) {
    const orderOwner = await db.user.findUnique({ where: { id: order.studentId } });
    if (orderOwner && orderOwner.cityId === user.cityId) {
      return {
        ok: false,
        error: "Заказ доступен только исполнителям из других городов",
      };
    }
  }

  try {
    await db.offer.create({
      data: {
        orderId,
        executorId: user.id,
        price: price * 100,
        message,
        etaDays,
      },
    });
  } catch {
    return { ok: false, error: "Вы уже откликались на этот заказ" };
  }

  // Уведомление студенту (без await чтобы не блокировать ответ — TG может тормозить)
  notifyNewOffer({
    studentId: order.studentId,
    orderCode: order.code,
    orderTitle: order.title,
    executorNickname: user.nickname,
    price: price * 100,
  }).catch(() => {});

  revalidatePath(`/orders/${order.code}`);
  return { ok: true };
}

export async function acceptOfferAction(offerId: string): Promise<ActionResult> {
  const user = await requireUser();
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { order: true },
  });
  if (!offer) return { ok: false, error: "Отклик не найден" };
  if (offer.order.studentId !== user.id) {
    return { ok: false, error: "Можно принимать только свои заказы" };
  }
  if (offer.order.status !== "OPEN") {
    return { ok: false, error: "Заказ уже не активен" };
  }

  const commission = Math.round(offer.price * 0.1);
  const payout = offer.price - commission;

  await db.$transaction([
    db.offer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    }),
    db.offer.updateMany({
      where: { orderId: offer.orderId, id: { not: offerId } },
      data: { status: "REJECTED" },
    }),
    db.order.update({
      where: { id: offer.orderId },
      data: { status: "IN_PROGRESS" },
    }),
    db.deal.create({
      data: {
        source: "ORDER",
        orderId: offer.orderId,
        buyerId: offer.order.studentId,
        sellerId: offer.executorId,
        amount: offer.price,
        commission,
        payout,
        status: "PAYMENT_HELD",
        chat: { create: {} },
      },
    }),
  ]);

  notifyOfferAccepted({
    executorId: offer.executorId,
    orderCode: offer.order.code,
    orderTitle: offer.order.title,
  }).catch(() => {});

  revalidatePath(`/orders/${offer.order.code}`);
  return { ok: true, redirect: `/orders/${offer.order.code}` };
}
