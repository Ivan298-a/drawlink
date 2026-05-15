import Link from "next/link";
import { db } from "@/lib/db";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Регистрация — DrawLink" };

export default async function SignUpPage() {
  const cities = await db.city.findMany({
    orderBy: [{ region: "asc" }, { name: "asc" }],
    select: { id: true, name: true, region: true },
  });

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg">
          Регистрация
        </h1>
        <p className="text-sm text-fg-secondary">
          Уже есть аккаунт?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:underline">
            Войти
          </Link>
        </p>
      </div>

      <SignUpForm cities={cities} />

      <p className="text-xs text-fg-muted">
        Регистрируясь, ты соглашаешься с офертой и политикой конфиденциальности.
        Реальное имя и ВУЗ остаются скрытыми от других пользователей.
      </p>
    </div>
  );
}
