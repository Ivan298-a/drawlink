"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requestUploadUrlAction } from "@/app/(main)/catalog/actions";
import { addEvidenceAction, resolveDisputeAction } from "../actions";

const resolutions = [
  {
    value: "ACCEPT_WITH_REVISIONS",
    title: "Принять с правками",
    description: "Исполнитель доделает работу. Сделка вернётся в работу.",
    variant: "secondary" as const,
  },
  {
    value: "PARTIAL_REFUND",
    title: "Частичный возврат",
    description: "Часть суммы возвращается заказчику, часть — исполнителю.",
    variant: "secondary" as const,
  },
  {
    value: "FULL_REFUND",
    title: "Полный возврат",
    description: "Сделка отменяется, заказчик получает деньги обратно.",
    variant: "danger" as const,
  },
];

export function ResolutionPanel({
  disputeId,
  dealAmount,
}: {
  disputeId: string;
  dealAmount: number; // в копейках
}) {
  const router = useRouter();
  return (
    <section className="flex flex-col gap-6 rounded-[14px] border border-brand/50 bg-surface p-6">
      <header className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          Действия
        </p>
        <h2 className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
          Добавить доказательства или предложить решение
        </h2>
        <p className="text-[13px] text-fg-secondary">
          Если стороны договорились — выбери решение, оно применится сразу. Иначе
          добавь доказательства и жди арбитраж.
        </p>
      </header>

      <AddEvidence disputeId={disputeId} router={router} />

      <hr className="border-border-subtle" />

      <ResolveForm
        disputeId={disputeId}
        dealAmount={dealAmount}
        router={router}
      />
    </section>
  );
}

function AddEvidence({
  disputeId,
  router,
}: {
  disputeId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function uploadAllAndSubmit() {
    setError(null);
    if (!text.trim() && files.length === 0) {
      setError("Добавь текст или файл");
      return;
    }

    const attachmentKeys: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        for (const file of files) {
          const req = await requestUploadUrlAction({
            bucket: "order-attachments",
            filename: file.name,
          });
          if (!req.ok) throw new Error(req.error);
          const { token, path } = req.data as {
            signedUrl: string;
            token: string;
            path: string;
          };
          const { error: upErr } = await supabase.storage
            .from("order-attachments")
            .uploadToSignedUrl(path, token, file, { upsert: true });
          if (upErr) throw new Error(upErr.message);
          attachmentKeys.push(path);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить файлы");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("disputeId", disputeId);
      if (text) fd.set("text", text);
      for (const k of attachmentKeys) fd.append("attachmentKeys", k);
      const result = await addEvidenceAction(fd);
      if (!result.ok) {
        setError(result.error);
      } else {
        setText("");
        setFiles([]);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold text-fg">Добавить доказательство</p>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Опиши факты: скриншоты переписки, ссылки на файлы, точные расхождения с ТЗ…"
        className={cn(
          "w-full rounded-[10px] border bg-inset p-4 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-muted",
          error
            ? "border-[color:var(--color-danger)]"
            : "border-border-subtle focus:border-brand"
        )}
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-border-subtle bg-inset p-3 text-[13px] text-fg-secondary hover:border-border-strong">
        <span>📎</span>
        <span className="flex-1">
          {files.length > 0
            ? `${files.length} файл(ов) выбрано: ${files.map((f) => f.name).join(", ")}`
            : "Прикрепить файлы (скриншоты, рендеры, методичка)"}
        </span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>

      {error && (
        <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={uploadAllAndSubmit}
          disabled={uploading || pending}
        >
          {uploading ? "Загружаем файлы…" : pending ? "Отправляем…" : "Добавить"}
        </Button>
      </div>
    </div>
  );
}

function ResolveForm({
  disputeId,
  dealAmount,
  router,
}: {
  disputeId: string;
  dealAmount: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [partialRub, setPartialRub] = useState<number>(
    Math.round(dealAmount / 100 / 2)
  );
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!selected) return;
    if (
      !window.confirm(
        "Решение применится сразу. Продолжить?"
      )
    )
      return;

    setError(null);
    const fd = new FormData();
    fd.set("disputeId", disputeId);
    fd.set("resolution", selected);
    if (selected === "PARTIAL_REFUND") {
      fd.set("partialRefundAmount", String(partialRub));
    }
    if (note) fd.set("note", note);

    startTransition(async () => {
      const result = await resolveDisputeAction(fd);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const dealRub = Math.round(dealAmount / 100);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] font-semibold text-fg">Предложить решение</p>
      <div className="flex flex-col gap-3">
        {resolutions.map((r) => {
          const sel = selected === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelected(r.value)}
              aria-pressed={sel}
              className={cn(
                "flex items-start gap-3 rounded-[12px] border p-4 text-left transition-colors",
                sel
                  ? "border-brand bg-elevated"
                  : "border-border-subtle bg-surface hover:border-border-strong"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1 size-4 shrink-0 rounded-full border-2",
                  sel ? "border-brand bg-brand" : "border-border-strong"
                )}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-fg">{r.title}</span>
                <span className="text-[12px] text-fg-secondary">{r.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected === "PARTIAL_REFUND" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            label="Возврат заказчику, ₽"
            value={partialRub}
            min={1}
            max={dealRub - 1}
            onChange={(e) => setPartialRub(Number(e.currentTarget.value))}
            hint={`Из ${dealRub} ₽. Остальное — исполнителю.`}
          />
          <Input
            label="Исполнитель получит, ₽"
            value={Math.max(0, dealRub - partialRub)}
            readOnly
            hint="Автоматический расчёт"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-fg-secondary">
          Комментарий к решению (опционально)
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Краткое обоснование решения"
          className="rounded-[10px] border border-border-subtle bg-inset p-3 text-[14px] text-fg outline-none transition-colors focus:border-brand"
        />
      </div>

      {error && (
        <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant={
            selected === "FULL_REFUND"
              ? "danger"
              : selected
                ? "primary"
                : "secondary"
          }
          size="md"
          onClick={submit}
          disabled={!selected || pending}
        >
          {pending ? "Применяем…" : "Применить решение"}
        </Button>
      </div>
    </div>
  );
}
