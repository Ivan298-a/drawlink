"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { signUpAction, type ActionResult } from "../actions";

type City = { id: number; name: string; region: string | null };

export function SignUpForm({ cities }: { cities: City[] }) {
  const [role, setRole] = useState<"STUDENT" | "EXECUTOR">("STUDENT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErrors({});
    setServerError(null);
    formData.set("role", role);
    startTransition(async () => {
      const result: ActionResult = await signUpAction(formData);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  }

  const cityOptions = cities.map((c) => ({
    value: c.id,
    label: c.name,
    group: c.region ?? "Прочее",
  }));

  return (
    <form action={onSubmit} className="flex flex-col gap-6" noValidate>
      {/* Role select */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-fg-secondary">Кто ты?</span>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            selected={role === "STUDENT"}
            onClick={() => setRole("STUDENT")}
            title="Заказчик"
            description="Заказываю чертежи"
          />
          <RoleCard
            selected={role === "EXECUTOR"}
            onClick={() => setRole("EXECUTOR")}
            title="Исполнитель"
            description="Делаю чертежи на заказ"
          />
        </div>
      </div>

      <Input
        name="nickname"
        label="Никнейм"
        placeholder="drafter_42"
        hint="Так тебя увидят другие. ФИО скрыто."
        autoComplete="username"
        required
        error={errors.nickname}
      />
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        error={errors.email}
      />
      <Select
        name="cityId"
        label="Город"
        placeholder="Выберите город"
        options={cityOptions}
        hint="Используется для фильтрации — одногородних показывать не будем."
        required
        error={errors.cityId}
      />
      <Input
        name="password"
        type="password"
        label="Пароль"
        placeholder="Минимум 8 символов"
        autoComplete="new-password"
        required
        error={errors.password}
      />

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-0.5 size-4 accent-[color:var(--brand)]"
        />
        <span className="text-fg-secondary">
          Согласен с офертой и политикой конфиденциальности
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="-mt-2 text-xs text-[color:var(--color-danger)]">{errors.acceptTerms}</p>
      )}

      {serverError && (
        <div className="rounded-lg border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {serverError}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Создаём аккаунт…" : "Создать аккаунт"}
      </Button>
    </form>
  );
}

function RoleCard({
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
        "flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors",
        selected
          ? "border-brand bg-elevated"
          : "border-border-subtle bg-surface hover:border-border-strong"
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.16em]",
          selected ? "text-brand" : "text-transparent"
        )}
      >
        {selected ? "● Выбрано" : "—"}
      </span>
      <span className="font-display text-lg font-semibold -tracking-[0.01em] text-fg">
        {title}
      </span>
      <span className="text-[13px] text-fg-secondary">{description}</span>
    </button>
  );
}
