import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatAgo = (date: Date) => {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} ${days < 5 ? "дня" : "дней"} назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return formatDate(date);
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const viewer = await getCurrentUser();

  const user = await db.user.findUnique({
    where: { nickname },
    include: {
      city: { select: { name: true } },
      executorCategories: {
        include: { category: { include: { parent: true } } },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: { select: { nickname: true } },
          deal: { select: { order: { select: { code: true } } } },
        },
      },
    },
  });

  if (!user) notFound();

  const isMe = viewer?.id === user.id;
  const isExecutor = user.role === "EXECUTOR";
  const verified = user.verificationStatus === "APPROVED";
  const rating = user.ratingAvg ? Number(user.ratingAvg) : 0;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-20">
      {/* Hero */}
      <section className="mb-8 flex flex-col gap-6 rounded-[14px] border border-border-subtle bg-inset p-8 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex size-28 shrink-0 items-center justify-center rounded-full bg-brand font-display text-3xl font-bold text-brand-foreground">
          {user.nickname.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
              {user.nickname}
            </h1>
            {verified && <Badge variant="verified">Проверен</Badge>}
            {isMe && <Badge variant="muted">Это ты</Badge>}
          </div>

          <p className="text-[14px] text-fg-secondary">
            {isExecutor ? "Исполнитель" : user.role === "STUDENT" ? "Заказчик" : "Админ"}
            {isExecutor && user.executorCategories.length > 0 && (
              <>
                {" · "}
                {Array.from(
                  new Set(
                    user.executorCategories.map(
                      (ec) => ec.category.parent?.name ?? ec.category.name
                    )
                  )
                ).join(", ")}
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-4 text-[13px] text-fg-muted">
            <span>📍 {user.city.name}</span>
            <span>·</span>
            <span>📅 С {formatDate(user.createdAt)}</span>
            {isExecutor && (
              <>
                <span>·</span>
                <span>💼 {user.dealsCount} сделок</span>
              </>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[14px] border border-border-subtle bg-border-subtle">
          <StatCell value={rating > 0 ? rating.toFixed(1) : "—"} label="рейтинг" />
          <StatCell value={user.dealsCount.toString()} label="сделок" />
          <StatCell value={user.reviewsCount.toString()} label="отзывов" />
        </div>
      </section>

      {/* Reviews */}
      {user.reviewsReceived.length > 0 && (
        <section className="mb-8 flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold -tracking-[0.01em] text-fg">
            Последние отзывы
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {user.reviewsReceived.map((r) => {
              const avg = Math.round(
                (r.ratingQuality + r.ratingSpeed + r.ratingComm) / 3
              );
              return (
                <article
                  key={r.id}
                  className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-surface p-6"
                >
                  <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-elevated text-[12px] font-bold text-brand">
                        {r.author.nickname.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-fg">
                          {r.author.nickname}
                        </span>
                        <span className="text-[11px] text-fg-muted">
                          {formatAgo(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={
                            i <= avg
                              ? "text-brand"
                              : "text-[color:var(--border-strong)]"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </header>
                  {r.text && (
                    <p className="text-[13px] leading-[1.6] text-fg">{r.text}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-fg-muted">
                    <ScoreCell label="Качество" value={r.ratingQuality} />
                    <ScoreCell label="Сроки" value={r.ratingSpeed} />
                    <ScoreCell label="Связь" value={r.ratingComm} />
                    {r.deal.order?.code && (
                      <>
                        <span>·</span>
                        <span className="font-bold tracking-[0.12em] text-brand">
                          {r.deal.order.code}
                        </span>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {user.reviewsReceived.length === 0 && isExecutor && (
        <section className="rounded-[14px] border border-dashed border-border-subtle bg-surface p-12 text-center">
          <p className="font-display text-lg font-semibold text-fg">
            Отзывов пока нет
          </p>
          <p className="mt-2 max-w-md text-sm text-fg-secondary">
            После первых завершённых сделок здесь появятся отзывы заказчиков —
            с оценками по качеству, срокам и общению.
          </p>
        </section>
      )}
    </div>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-surface px-6 py-4">
      <span className="font-display text-xl font-bold text-fg">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </span>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-fg-muted">{label}:</span>
      <span className="font-bold text-fg">{value}</span>
    </div>
  );
}
