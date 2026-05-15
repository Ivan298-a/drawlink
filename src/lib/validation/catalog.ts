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

export const publishCatalogItemSchema = z.object({
  title: z.string().trim().min(5, "Минимум 5 символов").max(120, "Максимум 120 символов"),
  description: z
    .string()
    .trim()
    .min(20, "Опишите работу подробнее (минимум 20 символов)")
    .max(2000, "Максимум 2000 символов"),
  categoryId: z.coerce.number().int().positive("Выберите категорию"),
  price: z.coerce
    .number()
    .int()
    .min(100, "Минимум 100 ₽")
    .max(10_000_000, "Слишком большая цена"),
  formats: z.array(z.enum(fileFormats)).min(1, "Выберите хотя бы один формат"),
  paperSize: z.enum(paperSizes),
  standard: z.enum(standards),
  previewKey: z.string().min(1, "Загрузите превью"),
  originalKey: z.string().min(1, "Загрузите оригинал"),
});

export type PublishCatalogItemInput = z.infer<typeof publishCatalogItemSchema>;
