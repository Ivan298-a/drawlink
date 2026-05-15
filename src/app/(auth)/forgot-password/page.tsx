import Link from "next/link";

export const metadata = { title: "Восстановление пароля — DrawLink" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg">
        Восстановление пароля
      </h1>
      <p className="text-sm text-fg-secondary">
        Эта страница в разработке. Пока — напиши в Telegram-поддержку, мы вручную
        сбросим пароль.
      </p>
      <Link href="/sign-in" className="text-sm font-medium text-brand hover:underline">
        ← Назад ко входу
      </Link>
    </div>
  );
}
