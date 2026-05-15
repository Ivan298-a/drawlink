import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Кабинет — DrawLink" };

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatRelativeDate = (date: Date) => {
  const diff = date.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return { label: "просрочен", urgent: true };
  if (days === 1) return { label: "1 день", urgent: true };
  if (days < 3) return { label: `${days} дня`, urgent: true };
  if (days < 5) return { label: `${days} дня`, urgent: false };
  return { label: `${days} дней`, urgent: false };
};

const orderStatusLabel: Record<string, { text: string; variant: "muted" | "success" | "info" | "warning" }> = {
  DRAFT: { text: "Черновик", variant: "muted" },
  OPEN: { text: "Открыт", variant: "success" },
  IN_PROGRESS: { text: "В работе", variant: "info" },
  REVIEW: { text: "На проверке", variant: "warning" },
  COMPLETED: { text: "Завершён", variant: "muted" },
  CANCELLED: { text: "Отменён", variant: "muted" },
  DISPUTED: { text: "Спор", variant: "warning" },
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const isStudent = user.role === "STUDENT";

  if (isStudent) {
    return <StudentDashboard userId={user.id} nickname={user.nickname} />;
  }
  return <ExecutorDashboard userId={user.id} nickname={user.nickname} />;
}

async function StudentDashboard({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}) {
  const [myOrders, deals, openCount] = await Promise.all([
    db.order.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        category: true,
        _count: { select: { offers: true } },
      },
    }),
    db.deal.findMany({
      where: {
        buyerId: userId,
        status: { in: ["PAYMENT_HELD", "DISPUTED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { nickname: true } },
        order: { select: { code: true, title: true } },
      },
    }),
    db.order.count({ where: { studentId: userId, status: "OPEN" } }),
  ]);

  const heldAmount = deals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-20">
      <DashboardHeader
        nickname={nickname}
        subtitle={`${openCount} ${openCount === 1 ? "открытый заказ" : openCount < 5 ? "открытых заказа" : "открытых заказов"} · ${deals.length} активных сделок`}
        action={
          <Link href="/orders/new">
            <Button variant="primary" size="md">
              Опубликовать заказ
            </Button>
          </Link>
        }
      />

      {/* KPI row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Открытые заказы" value={openCount.toString()} hint="Ждут откликов" />
        <KpiCard
          label="В работе"
          value={deals.length.toString()}
          hint="Под escrow"
          accent
        />
        <KpiCard label="Заморожено" value={formatRub(heldAmount)} hint="На платформе" />
      </div>

      {deals.length > 0 && (
        <Section title="Активные сделки">
          <ul className="flex flex-col gap-3">
            {deals.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 rounded-[12px] border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-brand">
                    {d.order?.code}
                  </p>
                  <p className="font-semibold text-fg">{d.order?.title}</p>
                  <p className="text-[12px] text-fg-muted">
                    Исполнитель: {d.seller.nickname}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={d.status === "DISPUTED" ? "warning" : "info"}>
                    {d.status === "DISPUTED" ? "Спор" : "В работе"}
                  </Badge>
                  <p className="font-display text-xl font-bold text-brand">
                    {formatRub(d.amount)}
                  </p>
                  {d.order && (
                    <Link href={`/orders/${d.order.code}`}>
                      <Button variant="secondary" size="sm">
                        Открыть
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Мои заказы" empty={myOrders.length === 0 ? "Ты пока не публиковал заказы." : undefined}>
        {myOrders.length > 0 && (
          <ul className="flex flex-col gap-3">
            {myOrders.map((o) => {
              const dl = formatRelativeDate(o.deadline);
              const status = orderStatusLabel[o.status];
              return (
                <li
                  key={o.id}
                  className="flex flex-col gap-3 rounded-[12px] border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-[0.12em] text-brand">
                        {o.code}
                      </span>
                      <Badge variant={status.variant}>{status.text}</Badge>
                      <Badge variant="soft">{o.category.name}</Badge>
                    </div>
                    <p className="font-semibold text-fg">{o.title}</p>
                    <p className="text-[12px] text-fg-muted">
                      {o._count.offers} откликов · до{" "}
                      <span className={dl.urgent ? "text-[color:var(--color-danger)]" : ""}>
                        {dl.label}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-display text-lg font-bold text-fg">
                      {formatRub(o.budget)}
                    </p>
                    <Link href={`/orders/${o.code}`}>
                      <Button variant="secondary" size="sm">
                        Открыть
                      </Button>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

async function ExecutorDashboard({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}) {
  const [deals, myOffers, completedCount, completedAmount] = await Promise.all([
    db.deal.findMany({
      where: {
        sellerId: userId,
        status: { in: ["PAYMENT_HELD", "DISPUTED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { nickname: true } },
        order: { select: { code: true, title: true, deadline: true } },
      },
    }),
    db.offer.findMany({
      where: { executorId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        order: { select: { code: true, title: true, status: true } },
      },
    }),
    db.deal.count({ where: { sellerId: userId, status: "RELEASED" } }),
    db.deal.aggregate({
      where: { sellerId: userId, status: "RELEASED" },
      _sum: { payout: true },
    }),
  ]);

  const earnedTotal = completedAmount._sum.payout ?? 0;
  const pendingPayout = deals.reduce((sum, d) => sum + d.payout, 0);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-20">
      <DashboardHeader
        nickname={nickname}
        subtitle={`${deals.length} активных сделок · ${myOffers.length} откликов ждут ответа`}
        action={
          <Link href="/orders">
            <Button variant="primary" size="md">
              Найти заказ
            </Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Активные сделки"
          value={deals.length.toString()}
          hint="Деньги под escrow"
          accent
        />
        <KpiCard
          label="Ожидает выплаты"
          value={formatRub(pendingPayout)}
          hint="После подтверждения"
        />
        <KpiCard
          label="Заработано всего"
          value={formatRub(earnedTotal)}
          hint={`${completedCount} завершённых`}
        />
      </div>

      {deals.length > 0 && (
        <Section title="Активные сделки">
          <ul className="flex flex-col gap-3">
            {deals.map((d) => {
              const dl = d.order ? formatRelativeDate(d.order.deadline) : null;
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-3 rounded-[12px] border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-[11px] font-bold tracking-[0.12em] text-brand">
                      {d.order?.code}
                    </p>
                    <p className="font-semibold text-fg">{d.order?.title}</p>
                    <p className="text-[12px] text-fg-muted">
                      Заказчик: {d.buyer.nickname}
                      {dl && (
                        <>
                          {" · до "}
                          <span className={dl.urgent ? "text-[color:var(--color-danger)]" : ""}>
                            {dl.label}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={d.status === "DISPUTED" ? "warning" : "info"}>
                      {d.status === "DISPUTED" ? "Спор" : "В работе"}
                    </Badge>
                    <p className="font-display text-xl font-bold text-brand">
                      {formatRub(d.payout)}
                    </p>
                    {d.order && (
                      <Link href={`/orders/${d.order.code}`}>
                        <Button variant="secondary" size="sm">
                          Открыть
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section
        title="Мои отклики"
        empty={
          myOffers.length === 0
            ? "Ты пока ни на что не откликнулся. Загляни в ленту заказов."
            : undefined
        }
      >
        {myOffers.length > 0 && (
          <ul className="flex flex-col gap-3">
            {myOffers.map((offer) => (
              <li
                key={offer.id}
                className="flex flex-col gap-3 rounded-[12px] border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-brand">
                    {offer.order.code}
                  </p>
                  <p className="font-semibold text-fg">{offer.order.title}</p>
                  <p className="text-[12px] text-fg-muted">
                    Твоё предложение: {offer.etaDays} дней
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="muted">Ждёт</Badge>
                  <p className="font-display text-xl font-bold text-brand">
                    {formatRub(offer.price)}
                  </p>
                  <Link href={`/orders/${offer.order.code}`}>
                    <Button variant="secondary" size="sm">
                      Открыть
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function DashboardHeader({
  nickname,
  subtitle,
  action,
}: {
  nickname: string;
  subtitle: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Кабинет
        </p>
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
          Привет, {nickname}
        </h1>
        <p className="text-sm text-fg-secondary">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[12px] border border-border-subtle bg-surface p-5">
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
      <span className="text-[12px] text-fg-secondary">{hint}</span>
    </div>
  );
}

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <section className="mb-8 flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
        {title}
      </h2>
      {empty ? (
        <div className="rounded-[12px] border border-dashed border-border-subtle bg-surface p-8 text-center text-sm text-fg-secondary">
          {empty}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
