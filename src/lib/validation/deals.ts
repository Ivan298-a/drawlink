import { z } from "zod";

export const markDeliveredSchema = z.object({
  dealId: z.uuid(),
  deliveredKey: z.string().min(1, "Загрузите файл"),
});

export const confirmDeliverySchema = z.object({
  dealId: z.uuid(),
});

export const submitReviewSchema = z.object({
  dealId: z.uuid(),
  ratingQuality: z.coerce.number().int().min(1).max(5),
  ratingSpeed: z.coerce.number().int().min(1).max(5),
  ratingComm: z.coerce.number().int().min(1).max(5),
  text: z
    .string()
    .trim()
    .max(2000, "Максимум 2000 символов")
    .optional()
    .or(z.literal("")),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
