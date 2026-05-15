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

const NICKNAME_COOLDOWN_DAYS = 30;
const nicknameRegex = /^[a-zA-Z0-9._]+$/;
const nicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа")
    .max(24, "Максимум 24 символа")
    .regex(nicknameRegex, "Только латиница, цифры, _ и ."),
});

export async function updateNicknameAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = nicknameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка" };
  }
  const newNickname = parsed.data.nickname;

  if (newNickname === user.nickname) {
    return { ok: false, error: "Это уже твой текущий никнейм" };
  }

  // Cooldown 30 дней
  if (user.nicknameChangedAt) {
    const nextAllowed = new Date(
      user.nicknameChangedAt.getTime() + NICKNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    );
    if (nextAllowed.getTime() > Date.now()) {
      const daysLeft = Math.ceil(
        (nextAllowed.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return {
        ok: false,
        error: `Менять никнейм можно раз в 30 дней. Следующая смена доступна через ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}.`,
      };
    }
  }

  // Уникальность
  const exists = await db.user.findUnique({ where: { nickname: newNickname } });
  if (exists) {
    return { ok: false, error: "Никнейм уже занят" };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      nickname: newNickname,
      nicknameChangedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
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
