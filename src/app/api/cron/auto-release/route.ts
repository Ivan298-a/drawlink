import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifyDealReleased } from "@/lib/telegram-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Auto-release: освобождает escrow на сделках, где исполнитель загрузил
 * готовое и прошло >= 72ч с момента загрузки без подтверждения и без спора.
 *
 * Запуск: GET /api/cron/auto-release
 * Защита: header `Authorization: Bearer <CRON_SECRET>`
 *
 * Конфиг для Vercel — см. vercel.json. Локально можно дёргать curl-ом.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const deals = await db.deal.findMany({
    where: {
      status: "PAYMENT_HELD",
      deliveredKey: { not: null },
      autoReleaseAt: { lte: now, not: null },
    },
    include: {
      chat: { select: { id: true } },
      order: { select: { id: true, code: true } },
    },
    take: 100,
  });

  let released = 0;
  const errors: string[] = [];

  for (const deal of deals) {
    try {
      await db.$transaction([
        db.deal.update({
          where: { id: deal.id },
          data: { status: "RELEASED", releasedAt: now },
        }),
        db.user.update({
          where: { id: deal.sellerId },
          data: { dealsCount: { increment: 1 } },
        }),
        ...(deal.orderId
          ? [
              db.order.update({
                where: { id: deal.orderId },
                data: { status: "COMPLETED", closedAt: now },
              }),
            ]
          : []),
        ...(deal.chat
          ? [
              db.message.create({
                data: {
                  chatId: deal.chat.id,
                  senderId: deal.sellerId, // от исполнителя, чтобы не мешать UX
                  body:
                    "⏱ Прошло 72 часа с момента загрузки. Платёж автоматически отправлен исполнителю.",
                },
              }),
            ]
          : []),
      ]);

      notifyDealReleased({
        sellerId: deal.sellerId,
        payout: deal.payout,
        orderCode: deal.order?.code ?? "—",
      }).catch(() => {});

      released++;
    } catch (e) {
      errors.push(`Deal ${deal.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    processedAt: now.toISOString(),
    scanned: deals.length,
    released,
    errors,
  });
}
