/**
 * Простые серверные rate-limit'ы поверх Prisma.
 *
 * Используем БД (а не in-memory), потому что Vercel serverless функции
 * stateless — каждый вызов может приземлиться на разный инстанс.
 *
 * Для high-traffic стоит мигрировать на Upstash Redis или Vercel KV.
 */
import { db } from "@/lib/db";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

/**
 * Лимит на количество заказов от одного студента.
 * Защита от спама "создание-удаление".
 */
export async function checkOrderRateLimit(userId: string): Promise<boolean> {
  const limit: RateLimitConfig = { windowMs: HOUR, max: 10 };
  const since = new Date(Date.now() - limit.windowMs);
  const recent = await db.order.count({
    where: { studentId: userId, createdAt: { gt: since } },
  });
  return recent < limit.max;
}

/**
 * Лимит на количество откликов от одного исполнителя.
 */
export async function checkOfferRateLimit(userId: string): Promise<boolean> {
  const limit: RateLimitConfig = { windowMs: HOUR, max: 30 };
  const since = new Date(Date.now() - limit.windowMs);
  const recent = await db.offer.count({
    where: { executorId: userId, createdAt: { gt: since } },
  });
  return recent < limit.max;
}

/**
 * Лимит на отправку сообщений в чате (защита от флуда).
 */
export async function checkMessageRateLimit(userId: string): Promise<boolean> {
  const limit: RateLimitConfig = { windowMs: MINUTE, max: 30 };
  const since = new Date(Date.now() - limit.windowMs);
  const recent = await db.message.count({
    where: { senderId: userId, createdAt: { gt: since } },
  });
  return recent < limit.max;
}

/**
 * Лимит на публикацию каталожных работ.
 */
export async function checkCatalogPublishRateLimit(userId: string): Promise<boolean> {
  const limit: RateLimitConfig = { windowMs: HOUR, max: 20 };
  const since = new Date(Date.now() - limit.windowMs);
  const recent = await db.catalogItem.count({
    where: { executorId: userId, createdAt: { gt: since } },
  });
  return recent < limit.max;
}

/**
 * Лимит на открытие споров. Очень строгий — не более 5 в день.
 * Это защита от злоупотребления спором.
 */
export async function checkDisputeRateLimit(userId: string): Promise<boolean> {
  const limit: RateLimitConfig = { windowMs: 24 * HOUR, max: 5 };
  const since = new Date(Date.now() - limit.windowMs);
  const recent = await db.dispute.count({
    where: { openedById: userId, createdAt: { gt: since } },
  });
  return recent < limit.max;
}

export const RATE_LIMIT_ERROR =
  "Слишком много действий за короткий промежуток. Попробуй через несколько минут.";
