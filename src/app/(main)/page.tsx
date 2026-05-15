import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { Button } from "@/components/ui/Button";

export const revalidate = 300; // ISR: каунты обновляются раз в 5 минут

const categoryKeys = [
  "drawings",
  "epyuri",
  "electrical",
  "models3d",
  "schemes",
  "other",
] as const;

const stepKeys = ["1", "2", "3", "4"] as const;
const privacyKeys = ["nicknames", "city", "metadata", "nda"] as const;

function formatCount(n: number): string {
  if (n === 0) return "Скоро";
  const formatted = new Intl.NumberFormat("ru-RU").format(n);
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "работ";
  if (mod10 === 1 && mod100 !== 11) word = "работа";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "работы";
  return `${formatted} ${word}`;
}

async function loadCategoryCounts(): Promise<Record<string, number>> {
  const roots = await db.category.findMany({
    where: { parentId: null },
    select: {
      slug: true,
      id: true,
      children: { select: { id: true } },
    },
  });
  const result: Record<string, number> = {};
  await Promise.all(
    roots.map(async (root) => {
      const ids = [root.id, ...root.children.map((c) => c.id)];
      result[root.slug] = await db.catalogItem.count({
        where: { isPublished: true, categoryId: { in: ids } },
      });
    })
  );
  return result;
}

type HeroStats = {
  executors: number;
  deals: number;
  rating: number | null;
};

async function loadHeroStats(): Promise<HeroStats> {
  const [executors, deals, ratingAgg] = await Promise.all([
    db.user.count({
      where: { role: "EXECUTOR", verificationStatus: "APPROVED" },
    }),
    db.deal.count({ where: { status: "RELEASED" } }),
    db.user.aggregate({
      where: { reviewsCount: { gt: 0 } },
      _avg: { ratingAvg: true },
    }),
  ]);
  return {
    executors,
    deals,
    rating: ratingAgg._avg.ratingAvg
      ? Number(ratingAgg._avg.ratingAvg)
      : null,
  };
}

function formatStat(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}k+`;
  if (n >= 100) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

export default async function LandingPage() {
  const [t, counts, stats] = await Promise.all([
    getTranslations(),
    loadCategoryCounts(),
    loadHeroStats(),
  ]);
  const showStats = stats.executors > 0 || stats.deals > 0;

  return (
    <>
      {/* HERO */}
        <section className="border-b border-border-subtle">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-20 lg:py-32">
            <div className="flex flex-col gap-7">
              <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
              <h1 className="font-display text-5xl font-bold leading-[1.02] -tracking-[0.03em] text-fg sm:text-6xl lg:text-[68px]">
                {t("hero.title")
                  .split("\n")
                  .map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
              </h1>
              <p className="max-w-xl text-lg leading-[1.55] text-fg-secondary">
                {t("hero.description")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/orders/new">
                  <Button variant="primary" size="lg">
                    {t("common.publishOrder")}
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button variant="secondary" size="lg">
                    {t("common.browseCatalog")}
                  </Button>
                </Link>
              </div>

              {showStats ? (
                <ul className="mt-2 flex flex-wrap items-center gap-6 divide-x divide-border-subtle">
                  {[
                    { key: "executors", value: formatStat(stats.executors), label: t("hero.stats.executors.label") },
                    { key: "deals", value: formatStat(stats.deals), label: t("hero.stats.deals.label") },
                    ...(stats.rating != null
                      ? [{ key: "rating", value: `${stats.rating.toFixed(1)} ★`, label: t("hero.stats.rating.label") }]
                      : []),
                  ].map((s, i) => (
                    <li key={s.key} className={i === 0 ? "pl-0" : "pl-6"}>
                      <p className="font-display text-[22px] font-bold -tracking-[0.01em] text-fg">
                        {s.value}
                      </p>
                      <p className="text-xs font-medium tracking-[0.02em] text-fg-muted">
                        {s.label}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-2 flex flex-wrap items-center gap-2">
                  {[
                    { icon: "🔒", label: "Платёж через escrow" },
                    { icon: "🛡", label: "Анонимно от ВУЗа" },
                    { icon: "✓", label: "10% комиссии" },
                  ].map((t) => (
                    <li
                      key={t.label}
                      className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3.5 py-1.5"
                    >
                      <span className="text-brand">{t.icon}</span>
                      <span className="text-[13px] font-medium text-fg-secondary">
                        {t.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="bg-inset">
          <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-20 lg:py-28">
            <div className="mb-12 flex flex-col gap-4">
              <Eyebrow>{t("categories.eyebrow")}</Eyebrow>
              <h2 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl lg:text-[44px]">
                {t("categories.title")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categoryKeys.map((key) => (
                <Link
                  key={key}
                  href={`/catalog?category=${key}`}
                  className="group flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-7 transition-colors hover:border-brand"
                >
                  <CategoryIcon variant={key} />
                  <h3 className="font-display text-[22px] font-semibold -tracking-[0.01em] text-fg">
                    {t(`categories.items.${key}.name`)}
                  </h3>
                  <p className="text-sm leading-[1.55] text-fg-secondary">
                    {t(`categories.items.${key}.description`)}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <span className="text-xs font-medium tracking-[0.08em] text-brand">
                      {formatCount(counts[key] ?? 0)}
                    </span>
                    <span className="text-brand transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section>
          <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-20 lg:py-28">
            <div className="mb-12 flex flex-col gap-4">
              <Eyebrow>{t("how.eyebrow")}</Eyebrow>
              <h2 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl lg:text-[44px]">
                {t("how.title")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stepKeys.map((k) => (
                <article key={k} className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-7">
                  <p className="font-display text-4xl font-bold -tracking-[0.04em] text-brand">
                    {String(k).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
                    {t(`how.steps.${k}.title`)}
                  </h3>
                  <p className="text-sm leading-[1.55] text-fg-secondary">
                    {t(`how.steps.${k}.description`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PRIVACY */}
        <section className="bg-inset">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-6 py-24 lg:grid-cols-2 lg:px-20 lg:py-28">
            <div className="flex flex-col gap-6">
              <Eyebrow>{t("privacy.eyebrow")}</Eyebrow>
              <h2 className="font-display text-3xl font-bold leading-[1.1] -tracking-[0.02em] text-fg sm:text-4xl lg:text-[44px]">
                {t("privacy.title")
                  .split("\n")
                  .map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
              </h2>

              <ul className="mt-2 flex flex-col gap-4">
                {privacyKeys.map((key) => (
                  <li key={key} className="flex items-start gap-4">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground">
                      <CheckIcon />
                    </div>
                    <div>
                      <p className="font-semibold text-fg">
                        {t(`privacy.points.${key}.title`)}
                      </p>
                      <p className="text-sm text-fg-secondary">
                        {t(`privacy.points.${key}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <PrivacyVisual maskedNick="drafter_A7K2" city="Новосибирск" />
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-7 px-6 py-28 text-center lg:px-20">
            <h2 className="max-w-3xl font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl lg:text-5xl">
              {t("cta.title")}
            </h2>
            <p className="max-w-xl text-lg text-fg-secondary">{t("cta.description")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/orders/new">
                <Button variant="primary" size="lg">
                  {t("common.publishOrder")}
                </Button>
              </Link>
              <Link href="/become-executor">
                <Button variant="secondary" size="lg">
                  {t("common.becomeExecutor")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-2 rounded-full bg-brand" aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
        {children}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5L6.5 12L13 4.5" />
    </svg>
  );
}

function CategoryIcon({ variant }: { variant: string }) {
  const stroke = "var(--brand)";
  return (
    <div className="flex size-14 items-center justify-center rounded-[10px] bg-elevated">
      <svg viewBox="0 0 36 36" className="size-7" fill="none" stroke={stroke} strokeWidth="1.5">
        {variant === "drawings" && (
          <>
            <rect x="6" y="11" width="24" height="14" rx="2" />
            <circle cx="18" cy="18" r="3" />
          </>
        )}
        {variant === "epyuri" && <polygon points="18,6 32,30 4,30" />}
        {variant === "electrical" && (
          <>
            <circle cx="10" cy="18" r="4" />
            <circle cx="26" cy="18" r="4" />
            <line x1="14" y1="18" x2="22" y2="18" />
          </>
        )}
        {variant === "models3d" && (
          <>
            <rect x="6" y="14" width="18" height="18" />
            <rect x="12" y="6" width="18" height="18" opacity="0.5" />
          </>
        )}
        {variant === "schemes" && (
          <>
            <rect x="6" y="20" width="6" height="12" fill={stroke} stroke="none" />
            <rect x="15" y="12" width="6" height="20" fill={stroke} stroke="none" />
            <rect x="24" y="24" width="6" height="8" fill={stroke} stroke="none" opacity="0.6" />
          </>
        )}
        {variant === "other" && (
          <>
            <line x1="6" y1="18" x2="30" y2="18" strokeWidth="2" />
            <line x1="18" y1="6" x2="18" y2="30" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}

function PrivacyVisual({ maskedNick, city }: { maskedNick: string; city: string }) {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface">
      <div className="absolute inset-x-[10%] top-[14%] rounded-xl border border-border-subtle bg-elevated p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand font-display font-bold text-brand-foreground">
            A7
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-fg">{maskedNick}</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-foreground">
                Проверен
              </span>
              <span className="text-xs font-semibold text-fg">4.9 ★</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted">ФИО:</span>
            <span className="h-3.5 w-44 rounded bg-border-strong" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-muted">ВУЗ:</span>
            <span className="h-3.5 w-40 rounded bg-border-strong" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-fg-muted">Город:</span>
            <span className="text-sm font-semibold text-fg">{city}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-8 rotate-[-8deg] rounded-md bg-brand px-4 py-2.5 text-center text-brand-foreground shadow-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Скрыто</p>
        <p className="text-[11px] font-medium">от вашего ВУЗа</p>
      </div>
    </div>
  );
}
