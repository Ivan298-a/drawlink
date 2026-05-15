import { z } from "zod";

// Никнейм: 3–24 символа, латиница/цифры/_/.
const nicknameRegex = /^[a-zA-Z0-9._]+$/;

export const signUpSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z
    .string()
    .min(8, "Пароль минимум 8 символов")
    .max(72, "Пароль слишком длинный"),
  nickname: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(24, "Максимум 24 символа")
    .regex(nicknameRegex, "Только латиница, цифры, _ и ."),
  cityId: z.coerce.number().int().positive("Выберите город"),
  role: z.enum(["STUDENT", "EXECUTOR"], { message: "Выберите роль" }),
  acceptTerms: z
    .string()
    .optional()
    .refine((v) => v === "on", "Нужно согласиться с офертой"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type SignInInput = z.infer<typeof signInSchema>;
