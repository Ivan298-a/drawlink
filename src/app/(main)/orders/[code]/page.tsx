import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { OfferForm } from "./OfferForm";
import { OffersList } from "./OffersList";

const formatRub = (kopecks: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(kopecks / 100)) + " ₽";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const fileFormatLabels: Record<string, string> = {
  KOMPAS: "КОМПАС",
  AUTOCAD_DWG: "AutoCAD (.dwg)",
  SOLIDWORKS: "SolidWorks",
  INVENTOR: "Inventor",
  PDF: "PDF",
  JPG: "JPG",
  PNG: "PNG",
  OTHER: "Другое",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const viewer = await getCurrentUser();

  const order = await db.order.findUnique({
    where: { code },
    include: {
      category: { include: { parent: true } },
      student: {
        select: {
          id: true,
          nickname: true,
          cityId: true,
          city: { select: { name: true } },
        },
      },
      offers: {
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        include: {
          executor: {
            select: {
              id: true,
              nickname: true,
              cityId: true,
              ratingAvg: true,
              reviewsCount: true,
              dealsCount: true,
              verificationStatus: true,
              city: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const isOwner = viewer?.id === order.studentId;
  const canSubmitOffer =
    viewer != null &&
    viewer.role !== "STUDENT" &&
    !isOwner &&
    order.status === "OPEN" &&
    (order.allowSameCity || viewer.cityId !== order.student.cityId) &&
    !order.offers.some((o) => o.executorId === viewer.id);

  const alreadyOffered = viewer
    ? order.offers.some((o) => o.executorId === viewer.id)
    : false;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-20">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-[13px] text-fg-muted">
        <a href="/orders" className="hover:text-fg">
          Заказы
        </a>
        <span>/</span>
        <span className="font-medium text-fg">{order.code}</span>
      </nav>

      {/* Header */}
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft">{order.category.name}</Badge>
          <Badge variant={order.status === "OPEN" ? "success" : "muted"}>
            {order.status === "OPEN"
              ? "Открыт"
              : order.status === "IN_PROGRESS"
                ? "В работе"
                : order.status === "REVIEW"
                  ? "На проверке"
                  : order.status === "COMPLETED"
                    ? "Завершён"
                    : order.status === "DISPUTED"
                      ? "Спор"
                      : "Отменён"}
          </Badge>
          {order.deliveryType === "DIGITAL_AND_PAPER" && (
            <Badge variant="outline">Бумага · {order.paperSize}</Badge>
          )}
          <span className="text-[12px] font-medium text-fg-muted">
            {order.code} · опубликован{" "}
            {formatDate(order.publishedAt ?? order.createdAt)}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-[1.15] -tracking-[0.02em] text-fg lg:text-[36px]">
          {order.title}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          {/* Description block */}
          <section className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-surface p-7">
            <h2 className="font-semibold text-fg">Описание задания</h2>
            <p className="whitespace-pre-line text-[15px] leading-[1.6] text-fg">
              {order.description}
            </p>

            {/* Params grid */}
            <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-border-subtle sm:grid-cols-3">
              <ParamCell label="Категория" value={order.category.name} />
              <ParamCell
                label="Формат файла"
                value={
                  order.fileFormats
                    .map((f) => fileFormatLabels[f] ?? f)
                    .join(", ") || "—"
                }
              />
              <ParamCell
                label="Размер листа"
                value={
                  order.deliveryType === "DIGITAL_AND_PAPER"
                    ? order.paperSize
                    : "Цифровой"
                }
              />
              <ParamCell
                label="Стандарт"
                value={
                  order.standard === "ESKD"
                    ? "ГОСТ ЕСКД"
                    : order.standard === "SPDS"
                      ? "ГОСТ СПДС"
                      : "Не требуется"
                }
              />
              <ParamCell label="Дедлайн" value={formatDate(order.deadline)} />
              <ParamCell label="Город заказчика" value={order.student.city.name} />
            </div>
          </section>

          {/* Offers list (owner) */}
          {isOwner && (
            <OffersList orderCode={order.code} offers={order.offers} />
          )}

          {/* Submit offer (executor) */}
          {canSubmitOffer && <OfferForm orderId={order.id} />}

          {alreadyOffered && !isOwner && (
            <div className="rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.10)] p-4 text-sm text-fg">
              Ты уже откликнулся на этот заказ. Ожидай решения заказчика.
            </div>
          )}

          {viewer == null && (
            <div className="rounded-[10px] border border-border-subtle bg-elevated p-4 text-sm text-fg-secondary">
              Чтобы откликнуться,{" "}
              <a href="/sign-in" className="font-medium text-brand hover:underline">
                войди
              </a>{" "}
              в свой аккаунт исполнителя.
            </div>
          )}
        </div>

        {/* Sidebar — budget & meta */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Бюджет
            </p>
            <p className="font-display text-4xl font-bold -tracking-[0.02em] text-fg">
              {formatRub(order.budget)}
            </p>
            <ul className="flex flex-col gap-2 text-[13px]">
              <li className="flex justify-between text-fg-secondary">
                <span>К оплате</span>
                <span className="font-medium text-fg">{formatRub(order.budget)}</span>
              </li>
              <li className="flex justify-between text-fg-secondary">
                <span>Комиссия (10%)</span>
                <span className="font-medium text-fg">
                  {formatRub(Math.round(order.budget * 0.1))}
                </span>
              </li>
              <li className="flex justify-between text-fg-secondary">
                <span>Исполнитель получит</span>
                <span className="font-medium text-fg">
                  {formatRub(order.budget - Math.round(order.budget * 0.1))}
                </span>
              </li>
            </ul>
            <div className="rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.10)] p-3 text-[12px] text-fg">
              🔒 Деньги замораживаются на платформе до подтверждения готовой работы.
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-[14px] border border-border-subtle bg-surface p-5 text-[13px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              🛡 Приватность
            </p>
            <Row label="Заказчик" value={order.student.nickname} />
            <Row label="Город заказчика" value={order.student.city.name} />
            <Row
              label="Фильтр городов"
              value={order.allowSameCity ? "Все города" : "Кроме одногородних"}
              valueClass="text-[color:var(--color-success)]"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ParamCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-elevated p-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </span>
      <span className="text-[14px] font-semibold text-fg">{value}</span>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-secondary">{label}</span>
      <span className={`font-medium ${valueClass ?? "text-fg"}`}>{value}</span>
    </div>
  );
}
