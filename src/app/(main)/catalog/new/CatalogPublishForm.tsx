"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  publishCatalogItemAction,
  requestUploadUrlAction,
  type ActionResult,
} from "../actions";

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

const paperOptions = [
  { value: "NONE", label: "Только цифровой" },
  { value: "A4", label: "A4 по запросу" },
  { value: "A3", label: "A3 по запросу" },
  { value: "A2", label: "A2 по запросу" },
  { value: "A1", label: "A1 по запросу" },
];

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; path: string; previewUrl?: string; fileName: string; fileSize: number }
  | { status: "error"; error: string };

export function CatalogPublishForm({
  categoryOptions,
}: {
  categoryOptions: CategoryOption[];
}) {
  const [formats, setFormats] = useState<string[]>(["PDF"]);
  const [preview, setPreview] = useState<UploadState>({ status: "idle" });
  const [original, setOriginal] = useState<UploadState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleFormat(v: string) {
    setFormats((curr) =>
      curr.includes(v) ? curr.filter((x) => x !== v) : [...curr, v]
    );
  }

  async function uploadFile(
    bucket: "catalog-previews" | "catalog-originals",
    file: File,
    setState: (s: UploadState) => void
  ) {
    setState({ status: "uploading", progress: 0 });
    const req = await requestUploadUrlAction({ bucket, filename: file.name });
    if (!req.ok) {
      setState({ status: "error", error: req.error });
      return;
    }
    const { token, path } = req.data as { signedUrl: string; token: string; path: string };

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file, { upsert: true });

    if (error) {
      setState({ status: "error", error: error.message });
      return;
    }

    let previewUrl: string | undefined;
    if (bucket === "catalog-previews") {
      previewUrl = URL.createObjectURL(file);
    }
    setState({
      status: "done",
      path,
      previewUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  }

  function onSubmit(formData: FormData) {
    setErrors({});
    setServerError(null);

    if (preview.status !== "done") {
      setServerError("Загрузи превью");
      return;
    }
    if (original.status !== "done") {
      setServerError("Загрузи оригинал");
      return;
    }

    formData.set("previewKey", preview.path);
    formData.set("originalKey", original.path);
    formData.delete("formats");
    for (const f of formats) formData.append("formats", f);

    startTransition(async () => {
      const result: ActionResult = await publishCatalogItemAction(formData);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      } else if (result.redirect) {
        router.push(result.redirect);
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="flex flex-col gap-6">
        {/* Files */}
        <FormCard title="01 — Файлы">
          <UploadField
            label="Превью (JPG/PNG)"
            hint="Скрин чертежа для каталога. До 5 МБ. Watermark наложится автоматически при отображении."
            accept="image/jpeg,image/png,image/webp"
            state={preview}
            onSelect={(file) =>
              uploadFile("catalog-previews", file, setPreview)
            }
            renderPreview={(state) =>
              state.status === "done" && state.previewUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border-subtle bg-inset bg-blueprint-grid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.previewUrl}
                    alt="preview"
                    className="size-full object-contain"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-3xl font-bold uppercase tracking-[0.4em] text-brand/25"
                    style={{ transform: "rotate(-22deg)" }}
                  >
                    DrawLink
                  </span>
                </div>
              ) : null
            }
          />
          <UploadField
            label="Оригинал (PDF / DWG / CDW / ZIP)"
            hint="Файл, который получит покупатель. До 50 МБ."
            accept=".pdf,.dwg,.cdw,.frw,.zip,application/pdf,application/zip,application/octet-stream"
            state={original}
            onSelect={(file) => uploadFile("catalog-originals", file, setOriginal)}
            renderPreview={(state) =>
              state.status === "done" ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-border-subtle bg-elevated p-4">
                  <div className="flex size-10 items-center justify-center rounded-[8px] bg-[color:oklch(0.69_0.16_70/0.16)] text-[10px] font-bold tracking-[0.16em] text-brand">
                    {state.fileName.split(".").pop()?.toUpperCase() ?? "FILE"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-fg">
                      {state.fileName}
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      {formatFileSize(state.fileSize)}
                    </span>
                  </div>
                </div>
              ) : null
            }
          />
        </FormCard>

        {/* Info */}
        <FormCard title="02 — Описание">
          <Input
            name="title"
            label="Название работы"
            placeholder="Например: Эпюр пересечения цилиндра и конуса, A3"
            required
            error={errors.title}
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="text-[13px] font-medium text-fg-secondary"
            >
              Подробное описание
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              placeholder="Что именно в работе. Какие размеры, материалы, особенности. Не упоминайте ФИО/ВУЗ."
              className={cn(
                "w-full rounded-[10px] border bg-inset p-4 text-[15px] text-fg placeholder:text-fg-muted outline-none transition-colors",
                errors.description
                  ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
                  : "border-border-subtle focus:border-brand"
              )}
            />
            {errors.description && (
              <p className="text-xs text-[color:var(--color-danger)]">
                {errors.description}
              </p>
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

        {/* Parameters */}
        <FormCard title="03 — Параметры и цена">
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
            {errors.formats && (
              <p className="text-xs text-[color:var(--color-danger)]">{errors.formats}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="paperSize"
              label="Бумажная копия"
              options={paperOptions}
              defaultValue="NONE"
            />
            <Select
              name="standard"
              label="Стандарт"
              options={standardOptions}
              defaultValue="ESKD"
            />
          </div>

          <Input
            name="price"
            type="number"
            label="Цена, ₽"
            placeholder="850"
            min={100}
            required
            error={errors.price}
            hint="Платформа удержит 10% комиссии"
          />
        </FormCard>

        {serverError && (
          <div className="rounded-lg border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
            {serverError}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={
              pending ||
              preview.status === "uploading" ||
              original.status === "uploading"
            }
          >
            {pending ? "Публикуем…" : "Опубликовать работу"}
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3 rounded-[14px] border border-border-subtle bg-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Как работает каталог
          </p>
          <ul className="flex flex-col gap-2 text-[13px] leading-[1.55] text-fg-secondary">
            <li>1. Загружаешь превью + оригинал.</li>
            <li>2. На превью в каталоге всегда watermark «DrawLink».</li>
            <li>3. После оплаты покупатель получает signed URL на оригинал на 15 минут.</li>
            <li>4. Подтверждение и оценка — через чат сделки.</li>
          </ul>
          <div className="rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.08)] p-3 text-[12px] text-fg">
            🛡 Покупатели из твоего города не увидят работу (если они оставили
            настройку приватности включённой).
          </div>
        </div>
      </aside>
    </form>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-7">
      <h2 className="text-[13px] font-semibold tracking-[0.16em] uppercase text-brand">
        {title}
      </h2>
      {children}
    </section>
  );
}

function UploadField({
  label,
  hint,
  accept,
  state,
  onSelect,
  renderPreview,
}: {
  label: string;
  hint: string;
  accept: string;
  state: UploadState;
  onSelect: (file: File) => void;
  renderPreview: (s: UploadState) => React.ReactNode;
}) {
  const id = `up-${label.replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-fg-secondary">
        {label}
      </label>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed bg-inset p-6 text-center transition-colors hover:border-border-strong",
          state.status === "error"
            ? "border-[color:var(--color-danger)]"
            : "border-border-subtle"
        )}
      >
        <span className="text-[14px] font-semibold text-fg">
          {state.status === "done"
            ? "✓ Загружено — нажми чтобы заменить"
            : state.status === "uploading"
              ? "Загружаем…"
              : "Перетащи файл или нажми"}
        </span>
        <span className="text-[12px] text-fg-muted">{hint}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
          }}
        />
      </label>
      {state.status === "error" && (
        <p className="text-xs text-[color:var(--color-danger)]">{state.error}</p>
      )}
      {renderPreview(state)}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
