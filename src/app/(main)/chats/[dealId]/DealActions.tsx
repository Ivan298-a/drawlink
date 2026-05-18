"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requestUploadUrlAction } from "@/app/(main)/catalog/actions";
import { openDisputeAction } from "@/app/(main)/disputes/actions";
import {
  disputeCategories,
  disputeCategoryLabels,
  type DisputeCategory,
} from "@/lib/validation/disputes";
import {
  confirmDeliveryAction,
  getDeliveredFileUrlAction,
  markDeliveredAction,
  submitReviewAction,
} from "../actions";

type Role = "BUYER" | "SELLER";

type Props = {
  dealId: string;
  role: Role;
  status: "PAYMENT_HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
  hasDelivered: boolean;
  hasReview: boolean;
  disputeCode?: string | null;
};

export function DealActions({
  dealId,
  role,
  status,
  hasDelivered,
  hasReview,
  disputeCode,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "deliver" | "review" | "dispute">(null);

  if (status === "RELEASED" && role === "BUYER" && !hasReview) {
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setModal("review")}>
          Оставить отзыв
        </Button>
        {modal === "review" && (
          <ReviewModal dealId={dealId} onClose={() => setModal(null)} router={router} />
        )}
      </>
    );
  }

  if (status === "RELEASED") {
    return (
      <Badge variant="success">{hasReview ? "Отзыв оставлен" : "Завершено"}</Badge>
    );
  }

  if (status === "DISPUTED") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="warning">Спор</Badge>
        {disputeCode && (
          <Link href={`/disputes/${disputeCode}`}>
            <Button variant="secondary" size="sm">
              Открыть спор
            </Button>
          </Link>
        )}
      </div>
    );
  }

  if (status === "REFUNDED") {
    return <Badge variant="muted">Возврат</Badge>;
  }

  // PAYMENT_HELD
  if (role === "SELLER") {
    return (
      <>
        {hasDelivered ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal("deliver")}
          >
            Перезалить готовое
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setModal("deliver")}>
            Загрузить готовое
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setModal("dispute")}>
          Открыть спор
        </Button>
        {modal === "deliver" && (
          <DeliverModal dealId={dealId} onClose={() => setModal(null)} router={router} />
        )}
        {modal === "dispute" && (
          <OpenDisputeModal
            dealId={dealId}
            onClose={() => setModal(null)}
            router={router}
          />
        )}
      </>
    );
  }

  // BUYER + PAYMENT_HELD
  return (
    <>
      <DownloadDeliveredButton dealId={dealId} disabled={!hasDelivered} />
      {hasDelivered && (
        <ConfirmDeliveryButton dealId={dealId} router={router} />
      )}
      <Button variant="ghost" size="sm" onClick={() => setModal("dispute")}>
        Открыть спор
      </Button>
      {modal === "dispute" && (
        <OpenDisputeModal
          dealId={dealId}
          onClose={() => setModal(null)}
          router={router}
        />
      )}
    </>
  );
}

/* ============= OPEN DISPUTE MODAL ============= */

function OpenDisputeModal({
  dealId,
  onClose,
  router,
}: {
  dealId: string;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [category, setCategory] = useState<DisputeCategory | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!category) {
      setError("Выбери категорию");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("dealId", dealId);
    fd.set("category", category);
    fd.set("reason", reason);
    startTransition(async () => {
      const result = await openDisputeAction(fd);
      if (!result.ok) {
        setError(result.error);
      } else {
        onClose();
        const to = result.data?.redirect as string | undefined;
        if (to) router.push(to);
        else router.refresh();
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold -tracking-[0.01em] text-fg">
            Открыть спор
          </h2>
          <p className="text-sm text-fg-secondary">
            Платёж заморозится до решения. Сначала попробуй договориться в чате —
            спор это крайняя мера.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-fg-secondary">Категория</span>
          <div className="flex flex-col gap-2">
            {disputeCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border p-3 text-left text-[14px] transition-colors",
                  category === c
                    ? "border-brand bg-elevated text-fg"
                    : "border-border-subtle text-fg-secondary hover:border-border-strong"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 rounded-full border-2",
                    category === c ? "border-brand bg-brand" : "border-border-strong"
                  )}
                />
                {disputeCategoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-fg-secondary">
            Опиши проблему
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Конкретные факты: что именно не соответствует ТЗ, какие пункты нарушены, на каких листах…"
            className="rounded-[10px] border border-border-subtle bg-inset p-3 text-[14px] text-fg outline-none transition-colors focus:border-brand"
          />
        </div>

        {error && (
          <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="danger"
            size="md"
            type="button"
            onClick={submit}
            disabled={pending}
          >
            {pending ? "Открываем…" : "Открыть спор"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDeliveryButton({
  dealId,
  router,
}: {
  dealId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    if (!window.confirm("Подтвердить готовую работу? Платёж уйдёт исполнителю.")) return;
    setError(null);
    const fd = new FormData();
    fd.set("dealId", dealId);
    startTransition(async () => {
      const result = await confirmDeliveryAction(fd);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={confirm}
        disabled={pending}
      >
        {pending ? "…" : "Подтвердить готовое"}
      </Button>
      {error && (
        <span className="text-[11px] text-[color:var(--color-danger)]">{error}</span>
      )}
    </>
  );
}

function DownloadDeliveredButton({
  dealId,
  disabled,
}: {
  dealId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (disabled) {
    return (
      <Badge variant="muted">Ждём готовую работу</Badge>
    );
  }
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        startTransition(async () => {
          const result = await getDeliveredFileUrlAction(dealId);
          if (result.ok && result.data?.url) {
            window.open(String(result.data.url), "_blank", "noopener");
          }
        });
      }}
      disabled={pending}
    >
      Скачать готовое
    </Button>
  );
}

/* ============= DELIVER MODAL ============= */

function DeliverModal({
  dealId,
  onClose,
  router,
}: {
  dealId: string;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit() {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const req = await requestUploadUrlAction({
        bucket: "order-attachments",
        filename: file.name,
      });
      if (!req.ok) {
        setError(req.error);
        setUploading(false);
        return;
      }
      const { token, path } = req.data as { signedUrl: string; token: string; path: string };
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage
        .from("order-attachments")
        .uploadToSignedUrl(path, token, file, { upsert: true });
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }

      startTransition(async () => {
        const fd = new FormData();
        fd.set("dealId", dealId);
        fd.set("deliveredKey", path);
        const result = await markDeliveredAction(fd);
        if (!result.ok) {
          setError(result.error);
        } else {
          router.refresh();
          onClose();
        }
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-bold -tracking-[0.01em] text-fg">
          Загрузить готовую работу
        </h2>
        <p className="text-sm text-fg-secondary">
          Прикрепи файл, который получит заказчик после подтверждения. После загрузки
          у заказчика 72 часа на проверку — потом платёж автоматически уйдёт тебе.
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-border-subtle bg-inset p-6 text-center hover:border-border-strong">
          <span className="text-[14px] font-semibold text-fg">
            {file ? `✓ ${file.name}` : "Перетащи файл или нажми"}
          </span>
          <span className="text-[12px] text-fg-muted">
            PDF, DWG, CDW, ZIP до 20 МБ
          </span>
          <input
            type="file"
            accept=".pdf,.dwg,.cdw,.frw,.zip,application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={submit}
            disabled={!file || uploading || pending}
          >
            {uploading || pending ? "Загружаем…" : "Загрузить и отправить"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ============= REVIEW MODAL ============= */

function ReviewModal({
  dealId,
  onClose,
  router,
}: {
  dealId: string;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [quality, setQuality] = useState(5);
  const [speed, setSpeed] = useState(5);
  const [comm, setComm] = useState(5);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("dealId", dealId);
    fd.set("ratingQuality", String(quality));
    fd.set("ratingSpeed", String(speed));
    fd.set("ratingComm", String(comm));
    if (text) fd.set("text", text);
    startTransition(async () => {
      const result = await submitReviewAction(fd);
      if (!result.ok) setError(result.error);
      else {
        router.refresh();
        onClose();
      }
    });
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-bold -tracking-[0.01em] text-fg">
          Оцени работу исполнителя
        </h2>
        <p className="text-sm text-fg-secondary">
          Отзыв помогает другим заказчикам выбрать проверенного исполнителя. Оценка
          публичная, текст можно оставить пустым.
        </p>

        <StarRow label="Качество" value={quality} onChange={setQuality} />
        <StarRow label="Сроки" value={speed} onChange={setSpeed} />
        <StarRow label="Коммуникация" value={comm} onChange={setComm} />

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-fg-secondary">
            Комментарий (опционально)
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Что понравилось / не понравилось. Не указывай ФИО, ВУЗ, контакты."
            className="rounded-[10px] border border-border-subtle bg-inset p-3 text-[14px] text-fg outline-none transition-colors focus:border-brand"
          />
        </div>

        {error && (
          <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            Позже
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={submit}
            disabled={pending}
          >
            {pending ? "Отправляем…" : "Опубликовать отзыв"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-medium text-fg-secondary">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`${i} звёзд`}
            className={cn(
              "text-2xl transition-colors",
              i <= value ? "text-brand" : "text-[color:var(--border-strong)] hover:text-fg-muted"
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============= MODAL SHELL ============= */

function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[16px] border border-border-subtle bg-surface shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
