"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateNicknameAction } from "./actions";

type Props = {
  current: string;
  changedAt: Date | null;
};

const COOLDOWN_DAYS = 30;

export function NicknameForm({ current, changedAt }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Сколько дней до следующей смены
  const nextAllowed = changedAt
    ? new Date(changedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const cooldownActive = nextAllowed ? nextAllowed.getTime() > Date.now() : false;
  const daysLeft = nextAllowed
    ? Math.ceil((nextAllowed.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  function submit() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("nickname", value);
    startTransition(async () => {
      const result = await updateNicknameAction(fd);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSaved(true);
        setEditing(false);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-fg">{current}</span>
          {cooldownActive ? (
            <span className="text-[11px] text-fg-muted">
              Следующая смена через {daysLeft}{" "}
              {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}
            </span>
          ) : (
            <span className="text-[11px] text-fg-muted">
              Можно сменить раз в 30 дней
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[12px] font-medium text-[color:var(--color-success)]">
              ✓ Сохранено
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue(current);
              setError(null);
              setEditing(true);
            }}
            disabled={cooldownActive}
          >
            Изменить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        name="nickname"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="например, drafter_42"
        autoFocus
        autoComplete="off"
        error={error ?? undefined}
        hint="Латиница, цифры, _ и точка. От 3 до 24 символов."
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={pending}
        >
          Отмена
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={pending || value.trim() === current || value.trim() === ""}
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
