import Link from "next/link";
import { db } from "@/lib/db";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

export default async function AdminDashboard() {
  const [
    pendingVerifications,
    openDisputes,
    totalUsers,
    activeDeals,
    completedDeals,
    commissionAgg,
    recentOrders,
  ] = await Promise.all([
    db.user.count({
      where: { role: "EXECUTOR", verificationStatus: "PENDING" },
    }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.user.count(),
    db.deal.count({ where: { status: "PAYMENT_HELD" } }),
    db.deal.count({ where: { status: "RELEASED" } }),
    db.deal.aggregate({
      _sum: { commission: true, amount: true },
      where: { status: "RELEASED" },
    }),
    db.order.findMany({
      where: { status: "OPEN" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: {
        student: { select: { nickname: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const commission = commissionAgg._sum.commission ?? 0;
  const turnover = commissionAgg._sum.amount ?? 0;

  return (
    <div className="px-8 py-10 lg:px-12">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Админ
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Дашборд
        </h1>
        <p className="text-sm text-fg-secondary">
          Обзор платформы. Срочные действия выделены янтарём.
        </p>
      </header>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ждут верификации"
          value={pendingVerifications.toString()}
          href="/admin/verifications"
          accent={pendingVerifications > 0}
        />
        <KpiCard
          label="Открытые споры"
          value={openDisputes.toString()}
          href="/admin/disputes"
          accent={openDisputes > 0}
        />
        <KpiCard label="Активных сделок" value={activeDeals.toString()} sub="Под escrow" />
        <KpiCard
          label="Завершённых"
          value={completedDeals.toString()}
          sub="Всего сделок"
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Пользователей"
          value={totalUsers.toString()}
          sub="Всего на платформе"
        />
        <KpiCard
          label="Оборот"
          value={formatRub(turnover)}
          sub="По завершённым сделкам"
        />
        <KpiCard
          label="Заработала платформа"
          value={formatRub(commission)}
          sub="Комиссия 10%"
        />
      </div>

      {/* Recent orders */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-fg">
            Свежие заказы (OPEN)
          </h2>
          <Link
            href="/orders"
            className="text-[13px] font-medium text-brand hover:underline"
          >
            Все заказы →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border-subtle bg-surface p-8 text-center text-sm text-fg-secondary">
            Открытых заказов нет
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[12px] border border-border-subtle bg-surface">
            {recentOrders.map((o, i) => (
              <li
                key={o.id}
                className={i > 0 ? "border-t border-border-subtle" : ""}
              >
                <Link
                  href={`/orders/${o.code}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-elevated"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold tracking-[0.12em] text-brand">
                      {o.code}
                    </span>
                    <span className="text-[14px] font-semibold text-fg">
                      {o.title}
                    </span>
                    <span className="text-[12px] text-fg-muted">
                      {o.student.nickname} · {o.category.name}
                    </span>
                  </div>
                  <span className="font-display text-lg font-bold text-brand">
                    {formatRub(o.budget)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <div
      className={`flex flex-col gap-1.5 rounded-[12px] border bg-surface p-5 transition-colors ${
        accent ? "border-brand" : "border-border-subtle"
      } ${href ? "hover:border-border-strong" : ""}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </span>
      <p
        className={`font-display text-3xl font-bold -tracking-[0.02em] ${
          accent ? "text-brand" : "text-fg"
        }`}
      >
        {value}
      </p>
      {sub && <span className="text-[12px] text-fg-secondary">{sub}</span>}
      {href && (
        <span className="text-[12px] font-medium text-brand">Открыть →</span>
      )}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
