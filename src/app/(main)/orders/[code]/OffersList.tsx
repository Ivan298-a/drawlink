"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { acceptOfferAction } from "../actions";

type Offer = {
  id: string;
  price: number;
  message: string;
  etaDays: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: Date;
  executor: {
    id: string;
    nickname: string;
    ratingAvg: { toString(): string } | number | null;
    reviewsCount: number;
    dealsCount: number;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    city: { name: string };
  };
};

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

export function OffersList({
  offers,
  orderCode,
}: {
  offers: Offer[];
  orderCode: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  void orderCode;

  function accept(id: string) {
    if (!confirm("Принять этот отклик? Деньги будут заморожены на платформе.")) return;
    startTransition(async () => {
      const result = await acceptOfferAction(id);
      if (!result.ok) {
        alert(result.error);
      } else if (result.redirect) {
        router.push(result.redirect);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  if (offers.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-border-subtle bg-surface p-12 text-center">
        <p className="font-display text-lg font-semibold text-fg">
          Откликов пока нет
        </p>
        <p className="max-w-md text-sm text-fg-secondary">
          Исполнители уже видят заказ в своей ленте. Обычно первые отклики приходят
          в течение часа.
        </p>
      </section>
    );
  }

  // Найдём лучший по рейтингу для бейджа «Рекомендуем»
  const ratingOf = (o: Offer) =>
    typeof o.executor.ratingAvg === "number"
      ? o.executor.ratingAvg
      : o.executor.ratingAvg
        ? parseFloat(o.executor.ratingAvg.toString())
        : 0;
  const bestId =
    offers.filter((o) => o.status === "PENDING").sort((a, b) => ratingOf(b) - ratingOf(a))[0]?.id;

  return (
    <section className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-surface p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-fg">
            Отклики · {offers.length}
          </h2>
          <p className="text-[13px] text-fg-secondary">
            Выбери исполнителя. Сравни рейтинг, цену и сроки.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {offers.map((offer) => {
          const isAccepted = offer.status === "ACCEPTED";
          const isRejected = offer.status === "REJECTED";
          const rating = ratingOf(offer);

          return (
            <li
              key={offer.id}
              className={`flex flex-col gap-4 rounded-[12px] border p-5 sm:flex-row sm:items-start ${
                isAccepted
                  ? "border-[color:var(--color-success)]/50 bg-[color:oklch(0.70_0.16_145/0.06)]"
                  : isRejected
                    ? "border-border-subtle bg-elevated opacity-60"
                    : offer.id === bestId
                      ? "border-brand bg-elevated"
                      : "border-border-subtle bg-elevated"
              }`}
            >
              {/* Avatar */}
              <div className="flex shrink-0 flex-col items-center gap-2 sm:w-20">
                <div className="flex size-14 items-center justify-center rounded-full bg-brand font-display font-bold text-brand-foreground">
                  {offer.executor.nickname.substring(0, 2).toUpperCase()}
                </div>
                <p className="text-center text-[12px] font-bold text-fg">
                  {rating > 0 ? `${rating.toFixed(1)} ★` : "Новый"}
                </p>
                {offer.executor.reviewsCount > 0 && (
                  <p className="text-[11px] text-fg-muted">
                    ({offer.executor.reviewsCount})
                  </p>
                )}
              </div>

              {/* Main content */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-fg">
                    {offer.executor.nickname}
                  </span>
                  {offer.executor.verificationStatus === "APPROVED" && (
                    <Badge variant="verified">Проверен</Badge>
                  )}
                  {offer.id === bestId && !isAccepted && !isRejected && (
                    <Badge variant="soft">Рекомендуем</Badge>
                  )}
                  {isAccepted && <Badge variant="success">Принят</Badge>}
                  {isRejected && <Badge variant="muted">Отклонён</Badge>}
                </div>
                <p className="text-[12px] text-fg-muted">
                  {offer.executor.city.name} · {offer.executor.dealsCount} сделок
                </p>
                <p className="text-[14px] leading-[1.55] text-fg">
                  {offer.message}
                </p>
              </div>

              {/* Action */}
              <div className="flex shrink-0 flex-col items-end gap-2 sm:min-w-[160px]">
                <p className="font-display text-xl font-bold text-brand">
                  {formatRub(offer.price)}
                </p>
                <p className="text-[12px] text-fg-secondary">
                  Срок: {offer.etaDays} {offer.etaDays === 1 ? "день" : offer.etaDays < 5 ? "дня" : "дней"}
                </p>
                {offer.status === "PENDING" && (
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={pending}
                    onClick={() => accept(offer.id)}
                  >
                    {pending ? "…" : "Выбрать"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
