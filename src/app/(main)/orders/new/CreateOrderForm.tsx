"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { createOrderAction, type ActionResult } from "../actions";

type CategoryOption = { value: number; label: string; group: string };

const fileFormatOptions = [
  { value: "KOMPAS", label: "КОМПАС (.cdw)" },
  { value: "AUTOCAD_DWG", label: "AutoCAD (.dwg)" },
  { value: "PDF", label: "PDF" },
  { value: "SOLIDWORKS", label: "SolidWorks" },
  { value: "INVENTOR", label: "Inventor" },
  { value: "JPG", label: "JPG/PNG" },
  { value: "OTHER", label: "Другое" },
];

const standardOptions = [
  { value: "ESKD", label: "ГОСТ ЕСКД" },
  { value: "SPDS", label: "ГОСТ СПДС" },
  { value: "NONE", label: "Без требований" },
];

export function CreateOrderForm({
  categoryOptions,
}: {
  categoryOptions: CategoryOption[];
}) {
  const [delivery, setDelivery] = useState<"DIGITAL" | "DIGITAL_AND_PAPER">("DIGITAL");
  const [paperSize, setPaperSize] = useState<"NONE" | "A4" | "A3" | "A2" | "A1">("NONE");
  const [formats, setFormats] = useState<string[]>(["KOMPAS", "PDF"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleFormat(v: string) {
    setFormats((curr) =>
      curr.includes(v) ? curr.filter((x) => x !== v) : [...curr, v]
    );
  }

  function onSubmit(formData: FormData) {
    setErrors({});
    setServerError(null);
    formData.set("deliveryType", delivery);
    formData.set("paperSize", paperSize);
    // multi-select: pass each format separately
    formData.delete("fileFormats");
    for (const f of formats) formData.append("fileFormats", f);
    startTransition(async () => {
      const result: ActionResult = await createOrderAction(formData);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      } else if (result.redirect) {
        router.push(result.redirect);
      }
    });
  }

  // Сегодня + 7 дней по умолчанию. useState-инициализатор гарантирует
  // одно и то же значение на SSR и при гидратации (без mismatch).
  const [defaultDeadline] = useState(
    () =>
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
  );

  return (
    <form action={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="flex flex-col gap-6">
        {/* Description */}
        <FormCard title="01 — Описание">
          <Input
            name="title"
            label="Заголовок задания"
            placeholder="Например: Эпюр пересечения цилиндра и конуса, лист А3"
            required
            error={errors.title}
          />
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-fg-secondary" htmlFor="description">
              Подробное описание
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder="Опишите задание по методичке. Размеры, материалы, особые требования. Не упоминайте ФИО или ВУЗ."
              className={cn(
                "w-full rounded-[10px] border bg-inset p-4 text-[15px] text-fg placeholder:text-fg-muted outline-none transition-colors",
                errors.description
                  ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
                  : "border-border-subtle focus:border-brand"
              )}
            />
            {errors.description && (
              <p className="text-xs text-[color:var(--color-danger)]">{errors.description}</p>
            )}
          </div>
          <Select
            name="categoryId"
            label="Категория"
            placeholder="Выберите категорию"
            options={categoryOptions}
            required
            error={errors.categoryId}
          />
        </FormCard>

        {/* Format & delivery */}
        <FormCard title="02 — Формат и передача">
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-medium text-fg-secondary">Формат файла</span>
            <div className="flex flex-wrap gap-2.5">
              {fileFormatOptions.map((f) => {
                const selected = formats.includes(f.value);
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => toggleFormat(f.value)}
                    aria-pressed={selected}
                    className={cn(
                      "btn-shimmer btn-shimmer-amber rounded-[10px] border px-3.5 py-2 text-[13px] font-medium transition-colors",
                      selected
                        ? "border-brand bg-[color:oklch(0.69_0.16_70/0.14)] text-brand"
                        : "border-border-subtle bg-elevated text-fg-secondary hover:border-border-strong"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            {errors.fileFormats && (
              <p className="text-xs text-[color:var(--color-danger)]">{errors.fileFormats}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-medium text-fg-secondary">Способ передачи</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <DeliveryCard
                selected={delivery === "DIGITAL"}
                onClick={() => {
                  setDelivery("DIGITAL");
                  setPaperSize("NONE");
                }}
                title="Только цифровой"
                description="Файл — мгновенно"
              />
              <DeliveryCard
                selected={delivery === "DIGITAL_AND_PAPER"}
                onClick={() => {
                  setDelivery("DIGITAL_AND_PAPER");
                  if (paperSize === "NONE") setPaperSize("A3");
                }}
                title="+ бумажная копия"
                description="A1 / A2 / A3 в твой город"
              />
            </div>
          </div>

          {delivery === "DIGITAL_AND_PAPER" && (
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-medium text-fg-secondary">Размер бумаги</span>
              <div className="flex gap-2">
                {(["A1", "A2", "A3", "A4"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPaperSize(s)}
                    aria-pressed={paperSize === s}
                    className={cn(
                      "btn-shimmer btn-shimmer-amber min-w-[68px] rounded-[10px] border px-4 py-2 text-[14px] font-semibold transition-colors",
                      paperSize === s
                        ? "border-brand bg-[color:oklch(0.69_0.16_70/0.14)] text-brand"
                        : "border-border-subtle bg-elevated text-fg-secondary hover:border-border-strong"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.paperSize && (
                <p className="text-xs text-[color:var(--color-danger)]">{errors.paperSize}</p>
              )}
              <div className="rounded-[10px] border border-[color:oklch(0.60_0.16_250/0.4)] bg-[color:oklch(0.60_0.16_250/0.10)] px-4 py-3 text-[13px] text-fg">
                <span className="font-semibold">ⓘ Внимание:</span> для бумажной копии фильтр городов
                отключается — нужен исполнитель из твоего города. Анонимность снижена.
              </div>
            </div>
          )}

          <Select
            name="standard"
            label="Стандарт"
            options={standardOptions}
            defaultValue="ESKD"
          />
        </FormCard>

        {/* Budget & deadline */}
        <FormCard title="03 — Бюджет и сроки">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="budget"
              type="number"
              label="Бюджет, ₽"
              placeholder="800"
              min={100}
              required
              error={errors.budget}
              hint="Платформа удержит 10% комиссии"
            />
            <Input
              name="deadline"
              type="date"
              label="Дедлайн"
              defaultValue={defaultDeadline}
              required
              error={errors.deadline}
            />
          </div>
        </FormCard>

        {serverError && (
          <div className="rounded-lg border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
            {serverError}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" size="lg" type="button">
            Сохранить черновик
          </Button>
          <Button variant="primary" size="lg" type="submit" disabled={pending}>
            {pending ? "Публикуем…" : "Опубликовать заказ"}
          </Button>
        </div>
      </div>

      {/* Sidebar preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Что увидят исполнители
          </p>
          <p className="text-sm leading-[1.55] text-fg-secondary">
            Твой никнейм и описание задания. ФИО, ВУЗ, email и телефон скрыты.
            Деньги — через escrow, 10% комиссии платформы.
          </p>
          <div className="rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.08)] p-3 text-[12px] text-fg">
            <span className="font-semibold text-brand">🛡 Приватно:</span> исполнители из твоего города
            не увидят заказ (кроме физической передачи).
          </div>
        </div>
      </aside>
    </form>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-7">
      <h2 className="text-[13px] font-semibold tracking-[0.16em] uppercase text-brand">{title}</h2>
      {children}
    </section>
  );
}

function DeliveryCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "btn-shimmer btn-shimmer-amber flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-brand bg-elevated"
          : "border-border-subtle bg-surface hover:border-border-strong"
      )}
    >
      <span className="font-semibold text-fg">{title}</span>
      <span className="text-[12px] text-fg-muted">{description}</span>
    </button>
  );
}
