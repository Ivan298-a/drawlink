"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInAction, type ActionResult } from "../actions";

export function SignInForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErrors({});
    setServerError(null);
    startTransition(async () => {
      const result: ActionResult = await signInAction(formData);
      if (!result.ok) {
        setServerError(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        error={errors.email}
      />
      <Input
        name="password"
        type="password"
        label="Пароль"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        error={errors.password}
      />

      <div className="flex justify-end">
        <Link
          href={"/forgot-password" as never}
          className="text-[13px] font-medium text-brand hover:underline"
        >
          Забыли пароль?
        </Link>
      </div>

      {serverError && (
        <div className="rounded-lg border border-[color:oklch(0.62_0.20_25/0.4)] bg-[color:oklch(0.62_0.20_25/0.12)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {serverError}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}
