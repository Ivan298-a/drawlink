import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Auto-arbitrage: эскалирует споры, которые открыты >24ч без решения сторон.
 * Не решает спор автоматически — просто переводит в статус ARBITRATION,
 * где они появляются в очереди админа. Админ применяет решение вручную.
 *
 * Запуск: GET /api/cron/auto-arbitrage
 * Защита: header `Authorization: Bearer <CRON_SECRET>`
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
  const disputes = await db.dispute.findMany({
    where: {
      status: "OPEN",
      autoResolveAt: { lte: now, not: null },
    },
    include: {
      deal: { select: { chat: { select: { id: true } } } },
    },
    take: 100,
  });

  let escalated = 0;
  const errors: string[] = [];

  for (const dispute of disputes) {
    try {
      await db.$transaction([
        db.dispute.update({
          where: { id: dispute.id },
          data: { status: "ARBITRATION" },
        }),
        ...(dispute.deal.chat
          ? [
              db.message.create({
                data: {
                  chatId: dispute.deal.chat.id,
                  senderId: dispute.openedById,
                  body:
                    "⏱ 24 часа на согласование истекли. Спор передан модератору на арбитраж.",
                },
              }),
            ]
          : []),
      ]);
      escalated++;
    } catch (e) {
      errors.push(`Dispute ${dispute.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    processedAt: now.toISOString(),
    scanned: disputes.length,
    escalated,
    errors,
  });
}
