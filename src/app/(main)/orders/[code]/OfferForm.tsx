"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { submitOfferAction, type ActionResult } from "../actions";

export function OfferForm({ orderId }: { orderId: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErrors({});
    setServerError(null);
    setSuccess(false);
    formData.set("orderId", orderId);
    startTransition(async () => {
      const result: ActionResult = await submitOfferAction(formData);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-[14px] border border-[color:var(--color-success)]/40 bg-[color:oklch(0.70_0.16_145/0.10)] p-6 text-center">
        <p className="font-display text-lg font-semibold text-fg">
          Отклик отправлен ✓
        </p>
        <p className="mt-1 text-sm text-fg-secondary">
          Заказчик увидит твоё предложение в своей ленте.
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-7"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-fg">Откликнуться на заказ</h2>
        <p className="text-[13px] text-fg-secondary">
          Кратко опиши, как сделаешь и за сколько. Чем конкретнее — тем выше шанс
          выбора.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="price"
          type="number"
          label="Твоя цена, ₽"
          placeholder="600"
          min={100}
          required
          error={errors.price}
        />
        <Input
          name="etaDays"
          type="number"
          label="Срок, дней"
          placeholder="3"
          min={1}
          required
          error={errors.etaDays}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="message"
          className="text-[13px] font-medium text-fg-secondary"
        >
          Сообщение заказчику
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Делал подобное. Готов в КОМПАС + PDF. Срок — 2 дня с момента подтверждения."
          className={cn(
            "w-full rounded-[10px] border bg-inset p-4 text-[15px] text-fg placeholder:text-fg-muted outline-none transition-colors",
            errors.message
              ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
              : "border-border-subtle focus:border-brand"
          )}
        />
        {errors.message && (
          <p className="text-xs text-[color:var(--color-danger)]">{errors.message}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {serverError}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить отклик"}
      </Button>
    </form>
  );
}
