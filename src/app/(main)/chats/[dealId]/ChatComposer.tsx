"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { sendMessageAction } from "../actions";

export function ChatComposer({ chatId }: { chatId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;
    const body = ta.value.trim();
    if (!body) return;

    const formData = new FormData();
    formData.set("chatId", chatId);
    formData.set("body", body);

    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        ta.value = "";
        autoResize(ta);
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-3 border-t border-border-subtle bg-surface px-6 py-4 lg:px-10"
    >
      <button
        type="button"
        aria-label="Прикрепить файл"
        className="btn-shimmer btn-shimmer-amber flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-elevated text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
        disabled
        title="Прикрепления — скоро"
      >
        📎
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <textarea
          ref={textareaRef}
          name="body"
          rows={1}
          placeholder="Написать сообщение… (не делись ФИО, ВУЗом или контактами)"
          onKeyDown={onKeyDown}
          onInput={(e) => autoResize(e.currentTarget)}
          className={cn(
            "max-h-[160px] min-h-[40px] resize-none rounded-[10px] border bg-inset px-4 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-muted",
            error
              ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
              : "border-border-subtle focus:border-brand"
          )}
        />
        {error && (
          <p className="text-[11px] text-[color:var(--color-danger)]">{error}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="md" disabled={pending}>
        {pending ? "…" : "Отправить"}
      </Button>
    </form>
  );
}
