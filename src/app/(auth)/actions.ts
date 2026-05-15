"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Проверьте поля формы", fieldErrors };
  }
  const { email, password, nickname, cityId, role } = parsed.data;

  // Проверки уникальности ДО создания Supabase-пользователя (избегаем orphan)
  const [existingByEmail, existingByNick] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { nickname } }),
  ]);
  if (existingByEmail) {
    return {
      ok: false,
      error: "Аккаунт с таким email уже существует",
      fieldErrors: { email: "Уже используется" },
    };
  }
  if (existingByNick) {
    return {
      ok: false,
      error: "Никнейм уже занят",
      fieldErrors: { nickname: "Уже занят" },
    };
  }
  const city = await db.city.findUnique({ where: { id: cityId } });
  if (!city) {
    return { ok: false, error: "Выбран несуществующий город" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { nickname, role },
    },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Не удалось создать аккаунт" };
  }

  try {
    await db.user.create({
      data: {
        authId: data.user.id,
        email,
        nickname,
        role,
        cityId,
      },
    });
  } catch (e) {
    console.error("Failed to create User row after signup", e);
    return {
      ok: false,
      error: "Аккаунт создан, но профиль не сохранён. Свяжитесь с поддержкой.",
    };
  }

  // Если Supabase требует подтверждение email — перенаправляем на info-страницу
  if (!data.session) {
    redirect("/sign-up/check-email");
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Проверьте поля формы", fieldErrors };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: "Неверный email или пароль" };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
