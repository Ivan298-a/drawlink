import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { disputeCategoryLabels, type DisputeCategory } from "@/lib/validation/disputes";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatCountdown = (target: Date | null): { label: string; urgent: boolean } => {
  if (!target) return { label: "—", urgent: false };
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { label: "истёк", urgent: true };
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / 60_000);
  return { label: `${h} ч ${m} мин`, urgent: h < 4 };
};

const formatAgo = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / (60 * 60 * 1000));
  if (h < 1) return "только что";
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
};

export default async function DisputesQueue() {
  const disputes = await db.dispute.findMany({
    where: { status: { in: ["OPEN", "ARBITRATION"] } },
    orderBy: [{ autoResolveAt: "asc" }, { createdAt: "asc" }],
    include: {
      openedBy: { select: { nickname: true } },
      deal: {
        include: {
          buyer: { select: { nickname: true } },
          seller: { select: { nickname: true } },
          order: { select: { code: true, title: true } },
          catalogItem: { select: { code: true, title: true } },
        },
      },
      _count: { select: { evidences: true } },
    },
  });

  return (
    <div className="px-8 py-10 lg:px-12">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Арбитраж
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Открытые споры
        </h1>
        <p className="text-sm text-fg-secondary">
          Сортировка: ближайший дедлайн первым. У сторон есть 24 часа на решение,
          потом — твоё.
        </p>
      </header>

      {disputes.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border-subtle bg-surface p-16 text-center">
          <p className="font-display text-xl font-semibold text-fg">
            ✓ Споров нет
          </p>
          <p className="mt-2 text-sm text-fg-secondary">
            Все разобраны. Хороший день.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {disputes.map((d) => {
            const refCode = d.deal.order?.code ?? d.deal.catalogItem?.code ?? "—";
            const refTitle = d.deal.order?.title ?? d.deal.catalogItem?.title ?? "Сделка";
            const countdown = formatCountdown(d.autoResolveAt);
            return (
              <li key={d.id}>
                <Link
                  href={`/disputes/${d.code}`}
                  className="grid grid-cols-1 gap-4 rounded-[12px] border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong lg:grid-cols-[1fr_240px_200px_140px]"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-[0.12em] text-brand">
                        {d.code}
                      </span>
                      <Badge variant="warning">
                        {disputeCategoryLabels[d.category as DisputeCategory] ?? d.category}
                      </Badge>
                    </div>
                    <p className="line-clamp-1 font-semibold text-fg">
                      {refTitle}
                    </p>
                    <p className="text-[12px] text-fg-muted">
                      {refCode} · открыл {d.openedBy.nickname} · {formatAgo(d.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      Стороны
                    </span>
                    <span className="text-[13px] text-fg">
                      {d.deal.buyer.nickname} → {d.deal.seller.nickname}
                    </span>
                    <span className="text-[12px] text-fg-muted">
                      📎 {d._count.evidences} доказательств
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      Сумма
                    </span>
                    <span className="font-display text-xl font-bold text-fg">
                      {formatRub(d.deal.amount)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      До решения
                    </span>
                    <span
                      className={`font-display text-lg font-bold ${
                        countdown.urgent
                          ? "text-[color:var(--color-danger)]"
                          : "text-fg"
                      }`}
                    >
                      {countdown.label}
                    </span>
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
