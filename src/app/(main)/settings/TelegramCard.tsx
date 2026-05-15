"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  disconnectTelegramAction,
  generateTelegramConnectAction,
  toggleTelegramNotifyAction,
} from "./actions";

type Props = {
  connected: boolean;
  username: string | null;
  notifyEnabled: boolean;
  configured: boolean;
};

export function TelegramCard({
  connected,
  username,
  notifyEnabled,
  configured,
}: Props) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateTelegramConnectAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLink(String(result.data?.url ?? ""));
    });
  }

  function disconnect() {
    if (!window.confirm("Отключить Telegram-уведомления?")) return;
    startTransition(async () => {
      await disconnectTelegramAction();
      router.refresh();
    });
  }

  function toggleNotify() {
    startTransition(async () => {
      await toggleTelegramNotifyAction();
      router.refresh();
    });
  }

  if (!configured) {
    return (
      <div className="rounded-[10px] border border-[color:oklch(0.78_0.16_80/0.4)] bg-[color:oklch(0.78_0.16_80/0.10)] p-4 text-[13px] text-fg">
        ⚠ Telegram-бот не настроен на платформе. Добавь{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 text-[12px]">
          TELEGRAM_BOT_TOKEN
        </code>{" "}
        и{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 text-[12px]">
          TELEGRAM_BOT_USERNAME
        </code>{" "}
        в <code>.env.local</code> и перезапусти сервер.
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[color:var(--color-success)]/40 bg-[color:oklch(0.70_0.16_145/0.10)] p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              ✈️
            </span>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-fg">
                Подключено{username ? `: @${username}` : ""}
              </span>
              <span className="text-[12px] text-fg-secondary">
                Уведомления приходят в Telegram
              </span>
            </div>
          </div>
          <Badge variant="success">Активно</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border-subtle bg-elevated p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-fg">
              Получать уведомления
            </span>
            <span className="text-[12px] text-fg-secondary">
              Новые отклики, сообщения, дедлайны, споры
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifyEnabled}
            onClick={toggleNotify}
            disabled={pending}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors p-0.5 ${
              notifyEnabled ? "bg-brand" : "bg-border-strong"
            }`}
          >
            <span
              aria-hidden
              className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                notifyEnabled ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={disconnect}
            disabled={pending}
          >
            Отключить
          </Button>
        </div>
      </div>
    );
  }

  if (link) {
    return (
      <div className="flex flex-col gap-3 rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.10)] p-5">
        <p className="text-[14px] font-semibold text-fg">
          1. Открой бот и нажми «Начать»
        </p>
        <p className="text-[12px] text-fg-secondary">
          Ссылка действует 15 минут. После этого вернись сюда и обнови
          страницу.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="primary" size="md">
              ✈️ Открыть Telegram
            </Button>
          </a>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.refresh()}
          >
            Я нажал «Начать»
          </Button>
        </div>
        <code className="break-all rounded bg-elevated px-3 py-2 text-[11px] text-fg-secondary">
          {link}
        </code>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-fg-secondary">
        Подключи Telegram, чтобы получать мгновенные уведомления о новых
        откликах, сообщениях в чате и спорах. В TG приходит короткое summary —
        полная работа всегда на сайте.
      </p>
      {error && (
        <p className="text-[12px] text-[color:var(--color-danger)]">{error}</p>
      )}
      <div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={generate}
          disabled={pending}
        >
          {pending ? "Генерируем ссылку…" : "Подключить Telegram"}
        </Button>
      </div>
    </div>
  );
}
