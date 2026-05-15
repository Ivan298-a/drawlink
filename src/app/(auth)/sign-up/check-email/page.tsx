import Link from "next/link";

export const metadata = { title: "Проверь почту — DrawLink" };

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" />
          <path d="M3 7L12 13L21 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold -tracking-[0.02em] text-fg">
          Проверь почту
        </h1>
        <p className="text-base leading-[1.55] text-fg-secondary">
          Мы отправили письмо со ссылкой для подтверждения адреса. Перейди по ней — и сразу попадёшь в свой кабинет.
        </p>
      </div>

      <div className="rounded-xl border border-border-subtle bg-elevated p-4 text-left text-sm text-fg-secondary">
        <p className="font-semibold text-fg">Не приходит письмо?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Проверь папку «Спам»</li>
          <li>Подожди 1–2 минуты — иногда задерживается</li>
          <li>
            Проверь, что email введён без опечаток —{" "}
            <Link href="/sign-up" className="text-brand hover:underline">
              вернуться к регистрации
            </Link>
          </li>
        </ul>
      </div>

      <Link href="/sign-in" className="text-sm font-medium text-brand hover:underline">
        Уже подтвердил — войти →
      </Link>
    </div>
  );
}
