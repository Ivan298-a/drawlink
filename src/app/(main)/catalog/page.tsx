import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Каталог готовых работ — DrawLink" };

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

export default async function CatalogListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentUser();
  const selectedCategorySlug = params.category;
  const sort = params.sort ?? "popular";

  // Иерархия: получим все корневые категории с детьми для фильтра
  const allCategories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });

  // Определим id фильтра (может быть подкатегория или корень → берём все потомки)
  let filterCategoryIds: number[] | undefined;
  if (selectedCategorySlug) {
    const cat = await db.category.findUnique({
      where: { slug: selectedCategorySlug },
      include: { children: { select: { id: true } } },
    });
    if (cat) {
      filterCategoryIds = [cat.id, ...cat.children.map((c) => c.id)];
    }
  }

  // Privacy filter: hide same-city executors for unauthenticated/student viewers
  const sameCityFilter =
    viewer && viewer.hideFromSameCity
      ? { executor: { cityId: { not: viewer.cityId } } }
      : {};

  const items = await db.catalogItem.findMany({
    where: {
      isPublished: true,
      ...(filterCategoryIds ? { categoryId: { in: filterCategoryIds } } : {}),
      ...sameCityFilter,
    },
    orderBy: sort === "fresh"
      ? { createdAt: "desc" }
      : sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" }, // default "popular" — TODO: by purchases count
    take: 60,
    include: {
      category: { include: { parent: { select: { name: true } } } },
      executor: {
        select: {
          nickname: true,
          ratingAvg: true,
          reviewsCount: true,
          verificationStatus: true,
          city: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-20">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Каталог
          </p>
          <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg sm:text-4xl">
            Готовые работы
          </h1>
          <p className="text-sm text-fg-secondary">
            {items.length} работ от проверенных исполнителей
          </p>
        </div>

        {viewer?.role === "EXECUTOR" && (
          <Link href="/catalog/new">
            <Button variant="primary" size="md">
              Опубликовать работу
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
              Категория
            </p>
            <ul className="flex flex-col gap-1">
              <CategoryLink
                href="/catalog"
                active={!selectedCategorySlug}
                label="Все категории"
              />
              {allCategories.map((root) => (
                <li key={root.id} className="flex flex-col gap-0.5">
                  <CategoryLink
                    href={`/catalog?category=${root.slug}`}
                    active={selectedCategorySlug === root.slug}
                    label={root.name}
                  />
                  {root.children.length > 0 && (
                    <ul className="ml-3 flex flex-col gap-0.5 border-l border-border-subtle pl-3">
                      {root.children.map((child) => (
                        <CategoryLink
                          key={child.id}
                          href={`/catalog?category=${child.slug}`}
                          active={selectedCategorySlug === child.slug}
                          label={child.name}
                          small
                        />
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 rounded-[14px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.08)] p-5 text-[12px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              🛡 Приватность
            </p>
            <p className="text-fg-secondary">
              {viewer?.hideFromSameCity
                ? `Скрыты работы из твоего города (${viewer.role === "STUDENT" ? "настройка по умолчанию" : "из настроек"}).`
                : "Фильтр одногородних выключен — настрой в Кабинете."}
            </p>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex flex-col gap-5">
          {/* Sort row */}
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-fg-secondary">
              {items.length}{" "}
              {items.length === 1 ? "работа" : items.length < 5 ? "работы" : "работ"}
            </p>
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-fg-muted">Сортировка:</span>
              <SortLink current={sort} value="popular" label="Популярные" cat={selectedCategorySlug} />
              <SortLink current={sort} value="fresh" label="Свежие" cat={selectedCategorySlug} />
              <SortLink current={sort} value="price-asc" label="Дешевле" cat={selectedCategorySlug} />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-border-subtle bg-surface p-16 text-center">
              <p className="font-display text-lg font-semibold text-fg">
                В этой категории пока пусто
              </p>
              <p className="mt-2 max-w-md text-sm text-fg-secondary">
                Загляни позже или выбери другую категорию. Исполнители постоянно
                добавляют новые работы.
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const rating = item.executor.ratingAvg
                  ? Number(item.executor.ratingAvg).toFixed(1)
                  : null;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/catalog/${item.code}`}
                      className="group flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-3 transition-colors hover:border-border-strong"
                    >
                      <PreviewImage
                        url={getPublicPreviewUrl(item.previewUrl)}
                        watermark
                        code={item.code}
                      />
                      <div className="flex flex-col gap-1.5 px-1.5 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="soft">
                            {item.category.parent?.name ?? item.category.name}
                          </Badge>
                        </div>
                        <h3 className="line-clamp-2 text-[15px] font-semibold leading-[1.35] text-fg">
                          {item.title}
                        </h3>

                        <div className="mt-1 flex items-center gap-2 text-[12px] text-fg-muted">
                          <span className="font-semibold text-fg">
                            {item.executor.nickname}
                          </span>
                          {item.executor.verificationStatus === "APPROVED" && (
                            <span className="text-brand">✓</span>
                          )}
                          <span>·</span>
                          <span>{item.executor.city.name}</span>
                          {rating && (
                            <>
                              <span>·</span>
                              <span>{rating} ★</span>
                            </>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-xl font-bold -tracking-[0.01em] text-brand">
                            {formatRub(item.price)}
                          </span>
                          <span className="text-[12px] font-medium text-brand transition-transform group-hover:translate-x-1">
                            Подробнее →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryLink({
  href,
  active,
  label,
  small,
}: {
  href: string;
  active: boolean;
  label: string;
  small?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`block rounded-[6px] px-2.5 py-1.5 transition-colors ${
          small ? "text-[12px]" : "text-[13px] font-medium"
        } ${
          active
            ? "bg-elevated text-brand"
            : "text-fg-secondary hover:bg-elevated hover:text-fg"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

function SortLink({
  current,
  value,
  label,
  cat,
}: {
  current: string;
  value: string;
  label: string;
  cat?: string;
}) {
  const params = new URLSearchParams();
  if (cat) params.set("category", cat);
  if (value !== "popular") params.set("sort", value);
  const href = params.toString() ? `/catalog?${params}` : "/catalog";
  const active = current === value;
  return (
    <Link
      href={href}
      className={`rounded-[6px] px-2 py-1 transition-colors ${
        active ? "bg-elevated text-fg font-semibold" : "text-fg-muted hover:text-fg"
      }`}
    >
      {label}
    </Link>
  );
}

function PreviewImage({
  url,
  watermark,
  code,
}: {
  url: string;
  watermark?: boolean;
  code: string;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border-subtle bg-inset bg-blueprint-grid">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={code}
          className="size-full object-contain"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <span className="text-[11px] tracking-[0.16em] text-fg-muted">{code}</span>
        </div>
      )}
      {watermark && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl font-display font-bold uppercase tracking-[0.4em] text-brand/25"
            style={{ transform: "rotate(-22deg)" }}
          >
            DrawLink
          </span>
          <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-[color:oklch(0.09_0.005_270/0.7)] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] text-brand backdrop-blur-sm">
            {code}
          </span>
        </>
      )}
    </div>
  );
}

function getPublicPreviewUrl(key: string): string {
  // Если уже полный URL — возвращаем как есть. Иначе собираем из NEXT_PUBLIC_SUPABASE_URL.
  if (key.startsWith("http")) return key;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  return `${base}/storage/v1/object/public/catalog-previews/${key}`;
}
