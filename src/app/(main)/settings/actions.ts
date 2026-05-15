"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { botDeepLink, telegramConfigured } from "@/lib/telegram";

export type ActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string };

const privacySchema = z.object({
  hideFromSameCity: z.string().optional(),
  hideFromSameVuz: z.string().optional(),
  showOnline: z.string().optional(),
});

export async function updatePrivacyAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = privacySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      hideFromSameCity: parsed.data.hideFromSameCity === "on",
      hideFromSameVuz: parsed.data.hideFromSameVuz === "on",
      showOnline: parsed.data.showOnline === "on",
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

/* ============= TELEGRAM ============= */

export async function generateTelegramConnectAction(): Promise<ActionResult> {
  const user = await requireUser();
  if (!telegramConfigured()) {
    return { ok: false, error: "Telegram-бот не настроен" };
  }
  const token = randomBytes(16).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: {
      telegramConnectToken: token,
      telegramConnectExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  return { ok: true, data: { url: botDeepLink(token) } };
}

export async function disconnectTelegramAction(): Promise<ActionResult> {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: null,
      telegramUsername: null,
      telegramConnectToken: null,
      telegramConnectExpiresAt: null,
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function toggleTelegramNotifyAction(): Promise<ActionResult> {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { notifyTelegram: !user.notifyTelegram },
  });
  revalidatePath("/settings");
  return { ok: true };
}

const cityChangeSchema = z.object({
  cityId: z.coerce.number().int().positive("Выберите город"),
});

export async function updateCityAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = cityChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }

  const city = await db.city.findUnique({ where: { id: parsed.data.cityId } });
  if (!city) return { ok: false, error: "Город не найден" };

  await db.user.update({
    where: { id: user.id },
    data: { cityId: parsed.data.cityId },
  });

  revalidatePath("/settings");
  return { ok: true };
}
