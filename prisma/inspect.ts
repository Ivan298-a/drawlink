/**
 * Снимок состояния БД для проверки E2E-теста между шагами.
 * Запуск: npm run db:inspect
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

const rub = (k: number) => `${Math.round(k / 100)}₽`;

async function main() {
  const [users, orders, offers, deals, disputes, reviews, msgs] = await Promise.all([
    db.user.findMany({
      where: { email: { contains: "@drawlink.test" } },
      select: { nickname: true, role: true, verificationStatus: true, telegramChatId: true, ratingAvg: true, dealsCount: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { code: true, title: true, status: true, budget: true, _count: { select: { offers: true } } },
    }),
    db.offer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { price: true, status: true, etaDays: true, executor: { select: { nickname: true } }, order: { select: { code: true } } },
    }),
    db.deal.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, amount: true, payout: true, deliveredKey: true, source: true,
        buyer: { select: { nickname: true } }, seller: { select: { nickname: true } } },
    }),
    db.dispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { code: true, status: true, category: true, resolution: true, _count: { select: { evidences: true } } },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { ratingQuality: true, ratingSpeed: true, ratingComm: true, target: { select: { nickname: true } } },
    }),
    db.message.count(),
  ]);

  console.log("\n=== ТЕСТОВЫЕ ЮЗЕРЫ ===");
  for (const u of users)
    console.log(`  ${u.nickname} [${u.role}] verif=${u.verificationStatus} tg=${u.telegramChatId ? "✓" : "—"} rating=${u.ratingAvg ?? "—"} deals=${u.dealsCount}`);

  console.log("\n=== ЗАКАЗЫ (5) ===");
  for (const o of orders)
    console.log(`  ${o.code} "${o.title}" ${o.status} ${rub(o.budget)} откликов:${o._count.offers}`);

  console.log("\n=== ОТКЛИКИ (5) ===");
  for (const o of offers)
    console.log(`  ${o.order.code} от ${o.executor.nickname} ${rub(o.price)} ${o.etaDays}д [${o.status}]`);

  console.log("\n=== СДЕЛКИ (5) ===");
  for (const d of deals)
    console.log(`  ${d.source} ${d.buyer.nickname}→${d.seller.nickname} ${rub(d.amount)} (payout ${rub(d.payout)}) [${d.status}] delivered=${d.deliveredKey ? "✓" : "—"}`);

  console.log("\n=== СПОРЫ (5) ===");
  for (const d of disputes)
    console.log(`  ${d.code} ${d.category} [${d.status}] resolution=${d.resolution ?? "—"} evidences:${d._count.evidences}`);

  console.log("\n=== ОТЗЫВЫ (5) ===");
  for (const r of reviews)
    console.log(`  → ${r.target.nickname}: качество ${r.ratingQuality}, сроки ${r.ratingSpeed}, связь ${r.ratingComm}`);

  console.log(`\n=== Всего сообщений в чатах: ${msgs} ===\n`);
}

main()
  .catch((e) => { console.error("❌", e.message ?? e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
