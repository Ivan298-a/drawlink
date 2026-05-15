import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Чаты — DrawLink" };

const formatAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "день" : d < 5 ? "дня" : "дней"}`;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
};

export default async function ChatsListPage() {
  const user = await requireUser("/chats");

  const chats = await db.chat.findMany({
    where: {
      deal: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
    },
    include: {
      deal: {
        include: {
          buyer: { select: { id: true, nickname: true } },
          seller: { select: { id: true, nickname: true } },
          order: { select: { code: true, title: true } },
          catalogItem: { select: { code: true, title: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true } } },
      },
      _count: {
        select: {
          messages: {
            where: { readAt: null, sender: { id: { not: user.id } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sortedChats = chats
    .map((c) => ({
      ...c,
      lastMessageAt: c.messages[0]?.createdAt ?? c.deal.createdAt,
    }))
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  const totalUnread = sortedChats.reduce((sum, c) => sum + c._count.messages, 0);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 lg:px-20">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Сообщения
        </p>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
            Чаты
          </h1>
          {totalUnread > 0 && <Badge variant="soft">{totalUnread} новых</Badge>}
        </div>
        <p className="text-sm text-fg-secondary">
          Переписка с заказчиками и исполнителями по активным сделкам.
        </p>
      </div>

      {sortedChats.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border-subtle bg-surface p-12 text-center">
          <p className="font-display text-lg font-semibold text-fg">
            Чатов пока нет
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            Чат создаётся автоматически, когда заказчик принимает отклик.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-[14px] border border-border-subtle bg-surface">
          {sortedChats.map((c, i) => {
            const counterpart =
              c.deal.buyerId === user.id ? c.deal.seller : c.deal.buyer;
            const lastMsg = c.messages[0];
            const refCode = c.deal.order?.code ?? c.deal.catalogItem?.code ?? "—";
            const refTitle = c.deal.order?.title ?? c.deal.catalogItem?.title ?? "Сделка";
            const unread = c._count.messages;
            const isUnread = unread > 0;
            return (
              <li key={c.id} className={i > 0 ? "border-t border-border-subtle" : ""}>
                <Link
                  href={`/chats/${c.dealId}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-elevated"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">
                    {counterpart.nickname.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-fg">{counterpart.nickname}</span>
                      <span className="text-[10px] font-bold tracking-[0.12em] text-brand">
                        {refCode}
                      </span>
                    </div>
                    <p className="truncate text-[13px] text-fg-muted">
                      {refTitle}
                    </p>
                    {lastMsg && (
                      <p
                        className={`truncate text-[13px] ${
                          isUnread ? "font-medium text-fg" : "text-fg-secondary"
                        }`}
                      >
                        {lastMsg.sender.id === user.id && "Ты: "}
                        {lastMsg.body}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-[11px] text-fg-muted">
                      {formatAgo(c.lastMessageAt)}
                    </span>
                    {isUnread && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
