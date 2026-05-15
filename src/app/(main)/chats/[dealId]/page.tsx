import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { ChatMessages } from "./ChatMessages";
import { ChatComposer } from "./ChatComposer";
import { DealActions } from "./DealActions";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const user = await requireUser();

  const chat = await db.chat.findUnique({
    where: { dealId },
    include: {
      deal: {
        include: {
          buyer: {
            select: {
              id: true,
              nickname: true,
              verificationStatus: true,
              city: { select: { name: true } },
            },
          },
          seller: {
            select: {
              id: true,
              nickname: true,
              verificationStatus: true,
              city: { select: { name: true } },
            },
          },
          order: { select: { code: true, title: true } },
          catalogItem: { select: { code: true, title: true } },
          review: { select: { id: true } },
          dispute: { select: { code: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, nickname: true } } },
      },
    },
  });

  if (!chat) notFound();
  if (chat.deal.buyerId !== user.id && chat.deal.sellerId !== user.id) {
    redirect("/chats");
  }

  const counterpart =
    chat.deal.buyerId === user.id ? chat.deal.seller : chat.deal.buyer;
  const ref = chat.deal.order ?? chat.deal.catalogItem;
  const sameCity =
    chat.deal.buyer.city.name === chat.deal.seller.city.name;
  const dealStatusLabel = {
    PAYMENT_HELD: { text: "В работе", variant: "info" as const },
    RELEASED: { text: "Завершено", variant: "success" as const },
    REFUNDED: { text: "Возврат", variant: "muted" as const },
    DISPUTED: { text: "Спор", variant: "warning" as const },
  }[chat.deal.status];

  return (
    <div className="mx-auto grid h-[calc(100vh-72px)] grid-rows-[auto_1fr_auto] max-w-[1200px]">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface px-6 py-4 lg:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/chats"
              aria-label="Назад"
              className="flex size-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
            >
              ←
            </Link>
            <div className="flex size-12 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">
              {counterpart.nickname.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-fg">
                  {counterpart.nickname}
                </span>
                {counterpart.verificationStatus === "APPROVED" && (
                  <Badge variant="verified">Проверен</Badge>
                )}
              </div>
              <p className="text-[12px] text-fg-muted">
                {counterpart.city.name}
                {!sameCity && " (другой город)"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <Badge variant={dealStatusLabel.variant}>{dealStatusLabel.text}</Badge>
            <div className="flex items-center gap-2 rounded-[10px] border border-border-subtle bg-elevated px-3 py-1.5">
              <span className="text-[10px] font-bold tracking-[0.12em] text-brand">
                {ref?.code}
              </span>
              <span className="text-[12px] font-semibold text-fg">
                {formatRub(chat.deal.amount)}
              </span>
            </div>
            <DealActions
              dealId={chat.deal.id}
              role={chat.deal.buyerId === user.id ? "BUYER" : "SELLER"}
              status={chat.deal.status}
              hasDelivered={Boolean(chat.deal.deliveredKey)}
              hasReview={Boolean(chat.deal.review)}
              disputeCode={chat.deal.dispute?.code ?? null}
            />
          </div>
        </div>
      </header>

      {/* Messages — scrollable */}
      <ChatMessages
        chatId={chat.id}
        dealId={chat.dealId}
        viewerId={user.id}
        initialMessages={chat.messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          senderId: m.senderId,
          senderNickname: m.sender.nickname,
        }))}
        counterpartNickname={counterpart.nickname}
        amountLabel={formatRub(chat.deal.amount)}
      />

      {/* Composer */}
      <ChatComposer chatId={chat.id} />
    </div>
  );
}
