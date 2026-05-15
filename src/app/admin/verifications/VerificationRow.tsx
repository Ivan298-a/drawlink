"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { setVerificationAction } from "../actions";

type Props = {
  user: {
    id: string;
    nickname: string;
    email: string;
    createdAt: string;
    cityName: string;
    profile: {
      realName: string | null;
      vuz: string | null;
      groupName: string | null;
    } | null;
    categories: string[];
    portfolio: Array<{
      id: string;
      code: string;
      title: string;
      previewUrl: string;
    }>;
  };
};

export function VerificationRow({ user }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(status: "APPROVED" | "REJECTED") {
    if (
      status === "REJECTED" &&
      !window.confirm("Отклонить заявку? Пользователь увидит статус.")
    )
      return;
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("status", status);
    startTransition(async () => {
      const result = await setVerificationAction(fd);
      if (!result.ok) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-6 lg:flex-row">
      {/* Left: info */}
      <div className="flex flex-col gap-4 lg:w-[360px]">
        <header className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-brand-foreground">
            {user.nickname.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
              {user.nickname}
            </span>
            <span className="text-[12px] text-fg-muted">
              {user.cityName} · с {user.createdAt}
            </span>
          </div>
        </header>

        {/* Private info — visible only to admin */}
        <div className="flex flex-col gap-2 rounded-[10px] border border-brand/40 bg-[color:oklch(0.69_0.16_70/0.06)] p-4 text-[13px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            🔒 Видно только админу
          </p>
          <Row label="ФИО" value={user.profile?.realName ?? "Не указано"} />
          <Row label="ВУЗ" value={user.profile?.vuz ?? "Не указан"} />
          <Row label="Группа" value={user.profile?.groupName ?? "Не указана"} />
          <Row label="Email" value={user.email} muted />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Специализация
          </p>
          {user.categories.length === 0 ? (
            <p className="text-[13px] text-fg-muted">Категории не выбраны</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.categories.map((c) => (
                <Badge key={c} variant="soft">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="danger"
            size="md"
            type="button"
            onClick={() => act("REJECTED")}
            disabled={pending}
          >
            Отклонить
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => act("APPROVED")}
            disabled={pending}
          >
            {pending ? "…" : "Одобрить"}
          </Button>
        </div>
      </div>

      {/* Right: portfolio */}
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          Портфолио ({user.portfolio.length})
        </p>
        {user.portfolio.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-border-subtle bg-inset p-8 text-center text-[13px] text-fg-muted">
            Исполнитель ещё не опубликовал ни одной работы. Можно отклонить и
            попросить заполнить портфолио.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.portfolio.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-[10px] border border-border-subtle bg-elevated p-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-border-subtle bg-inset bg-blueprint-grid-sm">
                  {item.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.code}
                      className="size-full object-contain"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 px-1.5 pb-1.5">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-brand">
                    {item.code}
                  </span>
                  <span className="line-clamp-2 text-[12px] text-fg">
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-fg-secondary">{label}</span>
      <span className={`font-semibold ${muted ? "text-fg-muted" : "text-fg"}`}>
        {value}
      </span>
    </div>
  );
}
