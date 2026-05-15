"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const verifyUserSchema = z.object({
  userId: z.uuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function setVerificationAction(formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = verifyUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Ошибка валидации" };

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { verificationStatus: parsed.data.status },
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { ok: true };
}
