import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@/generated/prisma/client";

/**
 * Возвращает текущего пользователя (если залогинен) и его профиль из нашей БД.
 * Кешируется в рамках одного запроса через React.cache.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await db.user.findUnique({ where: { authId: authUser.id } });
  return user;
});

/**
 * Гарантирует, что есть залогиненный пользователь. Если нет — редирект на /sign-in
 * с возвратом на текущий URL.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  return user;
}

export async function requireRole(role: User["role"]): Promise<User> {
  const user = await requireUser();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
