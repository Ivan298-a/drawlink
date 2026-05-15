import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { disputeCategoryLabels, type DisputeCategory } from "@/lib/validation/disputes";
import { ResolutionPanel } from "./ResolutionPanel";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const formatCountdown = (target: Date | null): string => {
  if (!target) return "—";
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "истекло";
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / 60_000);
  return `${h} ч ${m} мин`;
};

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser();

  const dispute = await db.dispute.findUnique({
    where: { code },
    include: {
      openedBy: { select: { id: true, nickname: true } },
      deal: {
        include: {
          buyer: { select: { id: true, nickname: true } },
          seller: { select: { id: true, nickname: true } },
          order: { select: { code: true, title: true } },
          catalogItem: { select: { code: true, title: true } },
        },
      },
      evidences: {
        orderBy: { createdAt: "asc" },
        include: { /* author resolution handled later via addedById */ },
      },
    },
  });

  if (!dispute) notFound();

  const isParticipant =
    dispute.deal.buyerId === user.id || dispute.deal.sellerId === user.id;
  if (!isParticipant && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Подтянем nickname'ы авторов доказательств
  const authorIds = Array.from(new Set(dispute.evidences.map((e) => e.addedById)));
  const authors = authorIds.length
    ? await db.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, nickname: true },
      })
    : [];
  const authorMap = new Map(authors.map((a) => [a.id, a.nickname]));

  const refTitle = dispute.deal.order?.title ?? dispute.deal.catalogItem?.title ?? "Сделка";
  const refCode = dispute.deal.order?.code ?? dispute.deal.catalogItem?.code ?? "—";

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-20">
      {/* Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-[14px] border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.10)] p-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[color:oklch(0.62_0.20_25/0.2)] text-2xl">
          ⚠
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-semibold text-fg">
            {dispute.status === "RESOLVED" ? "Спор закрыт" : "Открыт спор"} ·{" "}
            {dispute.code}
          </p>
          <p className="text-[13px] text-fg-secondary">
            Платёж {formatRub(dispute.deal.amount)} заморожен. Обе стороны могут
            добавлять доказательства.{" "}
            {dispute.status === "OPEN" &&
              "Если не договоритесь — модератор примет решение."}
          </p>
        </div>
        <Badge
          variant={dispute.status === "RESOLVED" ? "success" : "warning"}
        >
          {dispute.status === "RESOLVED"
            ? "Закрыт"
            : dispute.status === "ARBITRATION"
              ? "Арбитраж"
              : "В рассмотрении"}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left */}
        <div className="flex flex-col gap-5">
          {/* Order info */}
          <section className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-brand">
                  {refCode}
                </p>
                <h2 className="font-display text-xl font-semibold -tracking-[0.01em] text-fg">
                  {refTitle}
                </h2>
                <p className="text-[12px] text-fg-muted">
                  {dispute.deal.buyer.nickname} → {dispute.deal.seller.nickname}
                </p>
              </div>
              <p className="font-display text-2xl font-bold text-brand">
                {formatRub(dispute.deal.amount)}
              </p>
            </div>
          </section>

          {/* Reason */}
          <section className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Причина спора
            </p>
            <h3 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
              «{dispute.reason}»
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-muted">
              <Badge variant="outline">
                Открыл: {dispute.openedBy.nickname}
              </Badge>
              <Badge variant="soft">
                {disputeCategoryLabels[dispute.category as DisputeCategory] ??
                  dispute.category}
              </Badge>
              <span>·</span>
              <span>{formatDateTime(dispute.createdAt)}</span>
            </div>
          </section>

          {/* Evidences timeline */}
          <section className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <h2 className="font-semibold text-fg">
              Доказательства ({dispute.evidences.length})
            </h2>
            {dispute.evidences.length === 0 ? (
              <p className="text-[13px] text-fg-secondary">
                Стороны пока не добавили доказательства.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dispute.evidences.map((e) => {
                  const author = authorMap.get(e.addedById) ?? "—";
                  const isOpener = e.addedById === dispute.openedById;
                  return (
                    <li
                      key={e.id}
                      className="flex flex-col gap-2 rounded-[10px] border border-border-subtle bg-elevated p-4"
                    >
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="font-semibold text-fg">{author}</span>
                        <Badge variant={isOpener ? "warning" : "info"}>
                          {isOpener ? "Открывшая сторона" : "Ответ"}
                        </Badge>
                        <span className="text-fg-muted">·</span>
                        <span className="text-fg-muted">
                          {formatDateTime(e.createdAt)}
                        </span>
                      </div>
                      {e.text && (
                        <p className="whitespace-pre-line text-[14px] leading-[1.55] text-fg">
                          {e.text}
                        </p>
                      )}
                      {e.attachments.length > 0 && (
                        <p className="text-[12px] text-fg-muted">
                          📎 {e.attachments.length} файл(ов)
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Resolution panel — для участников или админа */}
          {dispute.status !== "RESOLVED" &&
            (isParticipant || user.role === "ADMIN") && (
              <ResolutionPanel
                disputeId={dispute.id}
                dealAmount={dispute.deal.amount}
              />
            )}

          {/* If resolved — show outcome */}
          {dispute.status === "RESOLVED" && dispute.resolution && (
            <section className="flex flex-col gap-2 rounded-[14px] border border-[color:var(--color-success)]/40 bg-[color:oklch(0.70_0.16_145/0.08)] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-success)]">
                Решение
              </p>
              <h3 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
                {dispute.resolution === "FULL_REFUND"
                  ? "Полный возврат заказчику"
                  : dispute.resolution === "PARTIAL_REFUND"
                    ? "Частичный возврат"
                    : "Принято с правками"}
              </h3>
              {dispute.resolutionNote && (
                <p className="text-[13px] text-fg-secondary">
                  {dispute.resolutionNote}
                </p>
              )}
              {dispute.resolvedAt && (
                <p className="text-[12px] text-fg-muted">
                  {formatDateTime(dispute.resolvedAt)}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {/* Timer */}
          {dispute.status !== "RESOLVED" && (
            <div className="flex flex-col gap-2 rounded-[14px] border border-border-subtle bg-surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Арбитраж
              </p>
              <p className="font-display text-3xl font-bold -tracking-[0.02em] text-fg">
                {formatCountdown(dispute.autoResolveAt)}
              </p>
              <p className="text-[12px] text-fg-secondary">
                до автоматического решения модератора
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              История
            </p>
            <ol className="flex flex-col gap-2">
              <TimelineRow
                done
                title="Спор открыт"
                subtitle={`${dispute.openedBy.nickname} · ${formatDateTime(dispute.createdAt)}`}
              />
              {dispute.evidences.length > 0 && (
                <TimelineRow
                  done
                  title="Доказательства добавлены"
                  subtitle={`${dispute.evidences.length} записей`}
                />
              )}
              <TimelineRow
                done={dispute.status === "RESOLVED"}
                title="Решение"
                subtitle={
                  dispute.status === "RESOLVED"
                    ? formatDateTime(dispute.resolvedAt!)
                    : "Ждём согласия сторон или арбитраж"
                }
              />
            </ol>
          </div>

          <Link
            href={`/chats/${dispute.dealId}`}
            className="rounded-[10px] border border-border-subtle bg-surface px-4 py-3 text-center text-[13px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
          >
            ← Вернуться в чат сделки
          </Link>
        </aside>
      </div>
    </div>
  );
}

function TimelineRow({
  done,
  title,
  subtitle,
}: {
  done: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          done ? "bg-brand text-brand-foreground" : "bg-elevated text-fg-muted"
        }`}
      >
        {done ? "✓" : "○"}
      </span>
      <div className="flex flex-col gap-0.5">
        <span
          className={`text-[13px] font-medium ${
            done ? "text-fg" : "text-fg-muted"
          }`}
        >
          {title}
        </span>
        <span className="text-[11px] text-fg-muted">{subtitle}</span>
      </div>
    </li>
  );
}
