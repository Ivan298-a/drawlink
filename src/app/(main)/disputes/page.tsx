import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { disputeCategoryLabels, type DisputeCategory } from "@/lib/validation/disputes";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "день" : d < 5 ? "дня" : "дней"} назад`;
};

const statusLabel: Record<string, { text: string; variant: "warning" | "success" | "muted" }> = {
  OPEN: { text: "Открыт", variant: "warning" },
  ARBITRATION: { text: "Арбитраж", variant: "warning" },
  RESOLVED: { text: "Закрыт", variant: "success" },
};

export const metadata = { title: "Мои споры — DrawLink" };

export default async function DisputesListPage() {
  const user = await requireUser("/disputes");

  const disputes = await db.dispute.findMany({
    where: {
      deal: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      openedBy: { select: { id: true, nickname: true } },
      deal: {
        select: {
          buyerId: true,
          sellerId: true,
          amount: true,
          buyer: { select: { nickname: true } },
          seller: { select: { nickname: true } },
          order: { select: { code: true, title: true } },
          catalogItem: { select: { code: true, title: true } },
        },
      },
      _count: { select: { evidences: true } },
    },
    take: 100,
  });

  const open = disputes.filter((d) => d.status !== "RESOLVED");
  const resolved = disputes.filter((d) => d.status === "RESOLVED");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-20">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Споры
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Мои споры
        </h1>
        <p className="text-sm text-fg-secondary">
          Открытые и закрытые споры по твоим сделкам. Как работает арбитраж —{" "}
          <Link href="/help#disputes" className="font-medium text-brand hover:underline">
            читай в FAQ
          </Link>
          .
        </p>
      </header>

      {disputes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-10">
          {open.length > 0 && (
            <Section title="Открытые" count={open.length}>
              <DisputeList rows={open} viewerId={user.id} />
            </Section>
          )}
          {resolved.length > 0 && (
            <Section title="Закрытые" count={resolved.length}>
              <DisputeList rows={resolved} viewerId={user.id} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

type DisputeRow = Awaited<ReturnType<typeof db.dispute.findMany>>[number] & {
  openedBy: { id: string; nickname: string };
  deal: {
    buyerId: string;
    sellerId: string;
    amount: number;
    buyer: { nickname: string };
    seller: { nickname: string };
    order: { code: string; title: string } | null;
    catalogItem: { code: string; title: string } | null;
  };
  _count: { evidences: number };
};

function DisputeList({
  rows,
  viewerId,
}: {
  rows: DisputeRow[];
  viewerId: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((d) => {
        const refCode = d.deal.order?.code ?? d.deal.catalogItem?.code ?? "—";
        const refTitle = d.deal.order?.title ?? d.deal.catalogItem?.title ?? "Сделка";
        const counterpart =
          d.deal.buyerId === viewerId ? d.deal.seller : d.deal.buyer;
        const myRole = d.deal.buyerId === viewerId ? "Заказчик" : "Исполнитель";
        const status = statusLabel[d.status] ?? statusLabel.OPEN;
        return (
          <li key={d.id}>
            <Link
              href={`/disputes/${d.code}`}
              className="flex flex-col gap-3 rounded-[12px] border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 flex-col gap-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-brand">
                    {d.code}
                  </span>
                  <Badge variant={status.variant}>{status.text}</Badge>
                  <Badge variant="soft">
                    {disputeCategoryLabels[d.category as DisputeCategory] ??
                      d.category}
                  </Badge>
                </div>
                <p className="font-semibold text-fg truncate">{refTitle}</p>
                <p className="text-[12px] text-fg-muted">
                  {myRole} · vs {counterpart.nickname} ·{" "}
                  📎 {d._count.evidences} · {formatAgo(d.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="font-display text-xl font-bold text-brand">
                  {formatRub(d.deal.amount)}
                </p>
                <span className="text-brand">→</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>
        <span className="rounded-full bg-elevated px-2.5 py-0.5 text-[12px] font-semibold text-fg-secondary">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border-subtle bg-surface p-16 text-center">
      <p className="font-display text-xl font-semibold text-fg">
        У тебя нет споров
      </p>
      <p className="max-w-md text-sm text-fg-secondary">
        Споры открываются прямо со страницы сделки — кнопкой «Открыть спор», если
        что-то пошло не так с готовой работой. Сначала всегда попробуй
        договориться в чате.
      </p>
      <Link
        href="/help#disputes"
        className="text-sm font-medium text-brand hover:underline"
      >
        Как работает арбитраж →
      </Link>
    </div>
  );
}
