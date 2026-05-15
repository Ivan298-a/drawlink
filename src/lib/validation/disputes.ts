import { z } from "zod";

export const disputeCategories = ["QUALITY", "DEADLINE", "SCOPE", "OTHER"] as const;
export type DisputeCategory = (typeof disputeCategories)[number];

export const disputeCategoryLabels: Record<DisputeCategory, string> = {
  QUALITY: "Качество не соответствует ТЗ",
  DEADLINE: "Срыв сроков",
  SCOPE: "Объём работы не совпадает",
  OTHER: "Другое",
};

export const openDisputeSchema = z.object({
  dealId: z.uuid(),
  category: z.enum(disputeCategories),
  reason: z
    .string()
    .trim()
    .min(20, "Опишите проблему подробнее (минимум 20 символов)")
    .max(2000, "Максимум 2000 символов"),
});

export const addEvidenceSchema = z.object({
  disputeId: z.uuid(),
  text: z.string().trim().max(2000).optional().or(z.literal("")),
  attachmentKeys: z.array(z.string()).default([]),
}).refine(
  (v) => Boolean(v.text) || (v.attachmentKeys && v.attachmentKeys.length > 0),
  { message: "Добавь текст или файл", path: ["text"] }
);

export const resolutions = [
  "ACCEPT_WITH_REVISIONS",
  "PARTIAL_REFUND",
  "FULL_REFUND",
] as const;

export const resolveDisputeSchema = z.object({
  disputeId: z.uuid(),
  resolution: z.enum(resolutions),
  partialRefundAmount: z.coerce.number().int().min(0).max(10_000_000).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
