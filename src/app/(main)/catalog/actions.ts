"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateCatalogCode } from "@/lib/orders/code";
import { publishCatalogItemSchema } from "@/lib/validation/catalog";

export type ActionResult =
  | { ok: true; redirect?: string; data?: Record<string, unknown> }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!errs[key]) errs[key] = issue.message;
  }
  return errs;
}

/**
 * Создаёт signed upload URL для прямой загрузки файла из браузера в Supabase Storage.
 * Путь = {userId}/{uuid}-{filename}. Доступ — только аутентифицированные.
 */
const requestUploadSchema = z.object({
  bucket: z.enum(["catalog-previews", "catalog-originals", "order-attachments"]),
  filename: z.string().min(1).max(200),
});

export async function requestUploadUrlAction(input: {
  bucket: "catalog-previews" | "catalog-originals" | "order-attachments";
  filename: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = requestUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Некорректные параметры" };

  const safeName = parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Не удалось создать URL загрузки" };
  }

  return {
    ok: true,
    data: { signedUrl: data.signedUrl, token: data.token, path },
  };
}

export async function publishCatalogItemAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser("/catalog/new");
  if (user.role !== "EXECUTOR" && user.role !== "ADMIN") {
    return { ok: false, error: "Только исполнители могут публиковать работы" };
  }

  const formats = formData.getAll("formats").map(String);
  const parsed = publishCatalogItemSchema.safeParse({
    ...Object.fromEntries(formData),
    formats,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Проверьте поля формы",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  let code = generateCatalogCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db.catalogItem.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCatalogCode();
  }

  const item = await db.catalogItem.create({
    data: {
      code,
      executorId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      price: data.price * 100,
      formats: data.formats,
      paperSize: data.paperSize,
      standard: data.standard,
      previewUrl: data.previewKey, // публичный bucket → URL получим через getPublicUrl
      originalKey: data.originalKey,
      isPublished: true,
    },
  });

  revalidatePath("/catalog");
  redirect(`/catalog/${item.code}`);
}

const purchaseSchema = z.object({
  itemId: z.uuid(),
});

export async function purchaseCatalogItemAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = purchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const item = await db.catalogItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { executor: { select: { id: true, cityId: true } } },
  });
  if (!item || !item.isPublished) {
    return { ok: false, error: "Работа недоступна" };
  }
  if (item.executorId === user.id) {
    return { ok: false, error: "Нельзя купить свою работу" };
  }

  // Простой ремайндер про фильтр одногородних (только предупреждение)
  // Покупки разрешаем даже из своего города — пользователь увидел и сам решил
  const commission = Math.round(item.price * 0.1);
  const payout = item.price - commission;

  const deal = await db.deal.create({
    data: {
      source: "CATALOG",
      catalogItemId: item.id,
      buyerId: user.id,
      sellerId: item.executorId,
      amount: item.price,
      commission,
      payout,
      status: "PAYMENT_HELD",
      chat: { create: {} },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  return { ok: true, redirect: `/chats/${deal.id}` };
}

/**
 * Возвращает signed URL на оригинал работы. Доступ только покупателю
 * после оплаты (Deal в PAYMENT_HELD или RELEASED).
 * URL действует 15 минут.
 */
export async function getCatalogOriginalUrlAction(itemId: string): Promise<ActionResult> {
  const user = await requireUser();

  const [item, deal] = await Promise.all([
    db.catalogItem.findUnique({ where: { id: itemId } }),
    db.deal.findFirst({
      where: {
        catalogItemId: itemId,
        buyerId: user.id,
        status: { in: ["PAYMENT_HELD", "RELEASED"] },
      },
    }),
  ]);
  if (!item) return { ok: false, error: "Работа не найдена" };

  // Доступ автору всегда, иначе — только покупателям
  if (item.executorId !== user.id && !deal) {
    return { ok: false, error: "Доступ только после покупки" };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from("catalog-originals")
    .createSignedUrl(item.originalKey, 15 * 60); // 15 минут
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "Не удалось создать ссылку" };
  }

  return { ok: true, data: { url: data.signedUrl } };
}

