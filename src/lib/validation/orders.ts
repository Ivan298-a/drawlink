import { z } from "zod";

const fileFormats = [
  "KOMPAS",
  "AUTOCAD_DWG",
  "SOLIDWORKS",
  "INVENTOR",
  "PDF",
  "JPG",
  "PNG",
  "OTHER",
] as const;

const paperSizes = ["NONE", "A4", "A3", "A2", "A1"] as const;
const standards = ["ESKD", "SPDS", "NONE"] as const;
const deliveryTypes = ["DIGITAL", "DIGITAL_AND_PAPER"] as const;

export const createOrderSchema = z
  .object({
    title: z.string().trim().min(5, "Минимум 5 символов").max(120, "Максимум 120 символов"),
    description: z
      .string()
      .trim()
      .min(20, "Опишите задание подробнее (минимум 20 символов)")
      .max(2000, "Максимум 2000 символов"),
    categoryId: z.coerce.number().int().positive("Выберите категорию"),
    fileFormats: z
      .array(z.enum(fileFormats))
      .min(1, "Выберите хотя бы один формат"),
    deliveryType: z.enum(deliveryTypes),
    paperSize: z.enum(paperSizes),
    standard: z.enum(standards),
    budget: z.coerce
      .number()
      .int()
      .min(100, "Минимум 100 ₽")
      .max(10_000_000, "Слишком большой бюджет"),
    deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
      message: "Дедлайн в прошлом",
    }),
  })
  .refine(
    (v) =>
      v.deliveryType === "DIGITAL" ? v.paperSize === "NONE" : v.paperSize !== "NONE",
    {
      message: "Укажите размер бумаги для физической передачи",
      path: ["paperSize"],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const createOfferSchema = z.object({
  orderId: z.uuid("Некорректный заказ"),
  price: z.coerce
    .number()
    .int()
    .min(100, "Минимум 100 ₽")
    .max(10_000_000, "Слишком большая цена"),
  message: z
    .string()
    .trim()
    .min(10, "Опишите подход (минимум 10 символов)")
    .max(1000, "Максимум 1000 символов"),
  etaDays: z.coerce.number().int().min(1, "Минимум 1 день").max(180, "Слишком долго"),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
