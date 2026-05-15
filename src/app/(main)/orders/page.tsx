import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Заказы — DrawLink" };

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatRelativeDate = (date: Date) => {
  const diff = date.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "просрочен";
  if (days === 1) return "1 день";
  if (days < 5) return `${days} дня`;
  return `${days} дней`;
};

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

export default async function OrdersBrowsePage() {
  const viewer = await getCurrentUser();

  // По умолчанию для исполнителей: скрываем заказы из своего города
  // (если только это не заказ с бумажной передачей — там allowSameCity = true)
  const sameCityFilter =
    viewer && viewer.role === "EXECUTOR"
      ? {
          OR: [
            { allowSameCity: true },
            { student: { cityId: { not: viewer.cityId } } },
          ],
        }
      : {};

  const orders = await db.order.findMany({
    where: {
      status: "OPEN",
      ...sameCityFilter,
    },
    orderBy: { publishedAt: "desc" },
    include: {
      category: true,
      student: { select: { cityId: true, city: { select: { name: true } } } },
      _count: { select: { offers: true } },
    },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-20">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Биржа заказов
          </p>
          <h1 className="font-display text-4xl font-bold -tracking-[0.02em] text-fg">
            {orders.length === 0 ? "Заказов пока нет" : `${orders.length} ${orders.length === 1 ? "заказ" : orders.length < 5 ? "заказа" : "заказов"}`}
          </h1>
          {viewer?.role === "EXECUTOR" && (
            <p className="text-sm text-fg-secondary">
              Скрыты заказы из твоего города (кроме физической передачи).
            </p>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => {
            const urgent =
              order.deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.code}`}
                  className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-surface p-6 transition-colors hover:border-border-strong sm:flex-row sm:items-stretch"
                >
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {urgent && <Badge variant="danger">Срочно</Badge>}
                      <Badge variant="soft">{order.category.name}</Badge>
                      {order.deliveryType === "DIGITAL_AND_PAPER" && (
                        <Badge variant="outline">{order.paperSize}</Badge>
                      )}
                      <span className="text-[11px] font-medium text-fg-muted">
                        {formatAgo(order.publishedAt ?? order.createdAt)}
                      </span>
                      <span className="text-[11px] font-bold tracking-[0.12em] text-brand">
                        {order.code}
                      </span>
                    </div>

                    <h2 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
                      {order.title}
                    </h2>
                    <p className="line-clamp-2 text-[13px] leading-[1.55] text-fg-secondary">
                      {order.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-fg-muted">
                      <span>📍 {order.student.city.name}</span>
                      <span>·</span>
                      <span>⏱ {formatRelativeDate(order.deadline)}</span>
                      <span>·</span>
                      <span>💬 {order._count.offers} откликов</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 sm:min-w-[200px]">
                    <p className="font-display text-2xl font-bold -tracking-[0.01em] text-brand">
                      {formatRub(order.budget)}
                    </p>
                    <span className="text-[13px] font-medium text-brand">
                      Подробнее →
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[14px] border border-dashed border-border-subtle bg-surface p-16 text-center">
      <p className="font-display text-2xl font-bold text-fg">Лента пустая</p>
      <p className="max-w-md text-sm text-fg-secondary">
        Когда студенты опубликуют задания — они появятся здесь. Если ты сам студент,
        начни с публикации заказа.
      </p>
      <Link
        href="/orders/new"
        className="text-sm font-medium text-brand hover:underline"
      >
        Опубликовать заказ →
      </Link>
    </div>
  );
}
