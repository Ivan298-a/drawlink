import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { CatalogItemActions } from "./CatalogItemActions";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);

const fileFormatLabels: Record<string, string> = {
  KOMPAS: "КОМПАС (.cdw)",
  AUTOCAD_DWG: "AutoCAD (.dwg)",
  SOLIDWORKS: "SolidWorks",
  INVENTOR: "Inventor",
  PDF: "PDF",
  JPG: "JPG",
  PNG: "PNG",
  OTHER: "Другое",
};

function getPublicPreviewUrl(key: string): string {
  if (key.startsWith("http")) return key;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/catalog-previews/${key}`;
}

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const viewer = await getCurrentUser();

  const item = await db.catalogItem.findUnique({
    where: { code },
    include: {
      category: { include: { parent: true } },
      executor: {
        select: {
          id: true,
          nickname: true,
          ratingAvg: true,
          reviewsCount: true,
          dealsCount: true,
          verificationStatus: true,
          city: { select: { name: true } },
        },
      },
    },
  });

  if (!item || !item.isPublished) notFound();

  const isAuthor = viewer?.id === item.executorId;
  const alreadyBought = viewer
    ? Boolean(
        await db.deal.findFirst({
          where: {
            catalogItemId: item.id,
            buyerId: viewer.id,
            status: { in: ["PAYMENT_HELD", "RELEASED"] },
          },
        })
      )
    : false;

  const rating = item.executor.ratingAvg
    ? Number(item.executor.ratingAvg).toFixed(1)
    : null;
  const commission = Math.round(item.price * 0.1);
  const payout = item.price - commission;
  const previewUrl = getPublicPreviewUrl(item.previewUrl);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-20">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-[13px] text-fg-muted">
        <Link href="/catalog" className="hover:text-fg">
          Каталог
        </Link>
        <span>/</span>
        <span className="font-medium text-fg">
          {item.category.parent?.name ?? item.category.name}
        </span>
        <span>/</span>
        <span className="text-fg-muted">{item.code}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_440px]">
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-border-subtle bg-inset bg-blueprint-grid">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={item.title}
                className="size-full object-contain"
              />
            ) : null}
            {/* Watermark overlay */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-6xl font-bold uppercase tracking-[0.5em] text-brand/25"
              style={{ transform: "rotate(-22deg)" }}
            >
              DrawLink
            </span>
            {/* Corner code */}
            <div className="absolute left-5 top-5 rounded-[10px] border border-border-subtle bg-inset/80 px-3.5 py-2 backdrop-blur-sm">
              <p className="text-[11px] font-bold tracking-[0.16em] text-brand">
                {item.code}
              </p>
              <p className="text-[11px] font-medium text-fg-secondary">
                {item.category.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.10)] px-4 py-3 text-[13px]">
            <span aria-hidden>ⓘ</span>
            <span className="font-medium text-fg">
              Превью с водяным знаком. После оплаты получишь оригинал без меток
              на 15 минут (можно скачать заново из чата сделки).
            </span>
          </div>

          {/* Description */}
          <section className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <h2 className="font-semibold text-fg">Описание</h2>
            <p className="whitespace-pre-line text-[14px] leading-[1.6] text-fg">
              {item.description}
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">{item.category.name}</Badge>
              {item.standard === "ESKD" && <Badge variant="outline">ЕСКД</Badge>}
              {item.paperSize !== "NONE" && (
                <Badge variant="outline">{item.paperSize}</Badge>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold leading-[1.15] -tracking-[0.02em] text-fg sm:text-[34px]">
              {item.title}
            </h1>
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand">
              {item.code} · {formatDate(item.createdAt)}
            </p>
          </div>

          {/* Buy card */}
          <div className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-surface p-6">
            <p className="font-display text-4xl font-bold -tracking-[0.02em] text-fg">
              {formatRub(item.price)}
            </p>
            <ul className="flex flex-col gap-1.5 border-y border-border-subtle py-4 text-[13px]">
              <li className="flex justify-between text-fg-secondary">
                <span>К оплате</span>
                <span className="font-medium text-fg">{formatRub(item.price)}</span>
              </li>
              <li className="flex justify-between text-fg-secondary">
                <span>Комиссия (10%)</span>
                <span className="font-medium text-fg">{formatRub(commission)}</span>
              </li>
              <li className="flex justify-between text-fg-secondary">
                <span>Автор получит</span>
                <span className="font-medium text-fg">{formatRub(payout)}</span>
              </li>
            </ul>

            <CatalogItemActions
              itemId={item.id}
              isAuthor={isAuthor}
              alreadyBought={alreadyBought}
              loggedIn={Boolean(viewer)}
            />

            <p className="text-[12px] text-fg-muted">
              🔒 Платёж заморожен на платформе. Списание после подтверждения, что
              файл соответствует превью.
            </p>
          </div>

          {/* Specs */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Параметры
            </p>
            <SpecRow
              label="Формат"
              value={
                item.formats.map((f) => fileFormatLabels[f] ?? f).join(", ") || "—"
              }
            />
            <SpecRow
              label="Бумажная копия"
              value={item.paperSize === "NONE" ? "По запросу" : item.paperSize}
            />
            <SpecRow
              label="Стандарт"
              value={
                item.standard === "ESKD"
                  ? "ГОСТ ЕСКД"
                  : item.standard === "SPDS"
                    ? "ГОСТ СПДС"
                    : "Не требуется"
              }
            />
            <SpecRow label="Лицензия" value="Личное использование" />
          </div>

          {/* Author card */}
          <Link
            href={`/u/${item.executor.nickname}`}
            className="flex items-center gap-3 rounded-[14px] border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-brand font-bold text-brand-foreground">
              {item.executor.nickname.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-fg">
                  {item.executor.nickname}
                </span>
                {item.executor.verificationStatus === "APPROVED" && (
                  <Badge variant="verified">Проверен</Badge>
                )}
              </div>
              <p className="text-[12px] text-fg-muted">
                {item.executor.city.name} ·{" "}
                {rating ? `${rating} ★ · ` : ""}
                {item.executor.dealsCount} сделок
              </p>
            </div>
            <span className="text-fg-muted">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0">
      <span className="text-[13px] text-fg-secondary">{label}</span>
      <span className="text-[13px] font-semibold text-fg text-right">{value}</span>
    </div>
  );
}
