"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { markChatReadAction } from "../actions";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderNickname: string;
};

type Props = {
  chatId: string;
  dealId: string;
  viewerId: string;
  initialMessages: ChatMessage[];
  counterpartNickname: string;
  amountLabel: string;
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const formatDay = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) {
    return (
      "Сегодня · " +
      new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d)
    );
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(d);
};

export function ChatMessages({
  chatId,
  dealId,
  viewerId,
  initialMessages,
  counterpartNickname,
  amountLabel,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Подписка на realtime inserts в messages для этого чата
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };
          setMessages((curr) => {
            if (curr.some((m) => m.id === row.id)) return curr;
            return [
              ...curr,
              {
                id: row.id,
                body: row.body,
                createdAt: row.created_at,
                senderId: row.sender_id,
                senderNickname:
                  row.sender_id === viewerId ? "Ты" : counterpartNickname,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, viewerId, counterpartNickname]);

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Mark as read when viewing
  useEffect(() => {
    markChatReadAction(chatId).catch(() => {});
  }, [chatId, messages.length]);

  // Group messages by day
  const groups: Array<{ day: string; items: ChatMessage[] }> = [];
  for (const m of messages) {
    const day = formatDay(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }

  return (
    <div className="overflow-y-auto bg-bg px-6 py-6 lg:px-10">
      {/* System banner about escrow */}
      <div className="mx-auto mb-4 flex max-w-max items-center gap-2.5 rounded-[10px] bg-[color:oklch(0.69_0.16_70/0.12)] px-4 py-2.5 text-[12px]">
        <span aria-hidden>🔒</span>
        <span className="font-medium text-fg">
          {amountLabel} заморожены на платформе. Списание после подтверждения
          готовой работы.
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-3">
            <DayDivider label={g.day} />
            {g.items.map((m, idx) => {
              const mine = m.senderId === viewerId;
              const prev = g.items[idx - 1];
              const showAvatar = !mine && (!prev || prev.senderId !== m.senderId);
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  mine={mine}
                  showAvatar={showAvatar}
                  counterpartInitials={counterpartNickname.substring(0, 2).toUpperCase()}
                />
              );
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="rounded-[12px] border border-dashed border-border-subtle bg-surface p-8 text-center">
            <p className="font-semibold text-fg">Начни диалог</p>
            <p className="mt-1 text-[13px] text-fg-secondary">
              Уточни детали задания. Не делись ФИО, ВУЗом или контактами.
            </p>
          </div>
        )}

        <div ref={bottomRef} aria-hidden />
      </div>
      {/* dealId mark to allow future deep-linking, suppress unused */}
      <span hidden data-deal-id={dealId} />
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="flex-1 border-t border-border-subtle" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        {label}
      </span>
      <div className="flex-1 border-t border-border-subtle" />
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  showAvatar,
  counterpartInitials,
}: {
  message: ChatMessage;
  mine: boolean;
  showAvatar: boolean;
  counterpartInitials: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end gap-2.5",
        mine ? "justify-end" : "justify-start"
      )}
    >
      {!mine && (
        <div
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground",
            !showAvatar && "invisible"
          )}
        >
          {counterpartInitials}
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[68%] flex-col gap-1",
          mine ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-[12px] px-4 py-2.5 text-[14px] leading-[1.5] whitespace-pre-wrap break-words",
            mine
              ? "bg-brand text-brand-foreground rounded-br-[4px]"
              : "bg-elevated text-fg rounded-bl-[4px]"
          )}
        >
          {message.body}
        </div>
        <span className="text-[10px] text-fg-muted">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
