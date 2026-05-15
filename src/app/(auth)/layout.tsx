import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_7fr]">
      {/* Left — brand pane */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border-subtle bg-inset p-15 lg:flex">
        <Link href="/" aria-label="DrawLink">
          <Logo size="md" />
        </Link>

        <div className="flex flex-col gap-6">
          <h1 className="font-display text-5xl font-bold leading-[1.05] -tracking-[0.03em] text-fg">
            Создай аккаунт за 30 секунд.
          </h1>
          <p className="max-w-md text-base leading-[1.55] text-fg-secondary">
            Никнейм вместо ФИО. ВУЗ скрыт от других пользователей. Платежи через защищённый escrow.
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {["Анонимно — без ФИО и ВУЗа", "Деньги защищены escrow", "Возврат при споре"].map(
              (t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <svg viewBox="0 0 12 12" fill="none" className="size-3" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6.5L4.5 9L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-fg">{t}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Decorative dim line at bottom */}
        <div className="relative h-3">
          <div className="absolute inset-x-0 top-1/2 h-px bg-brand/40" />
          <div className="absolute left-0 top-0 h-3 w-px bg-brand/40" />
          <div className="absolute right-0 top-0 h-3 w-px bg-brand/40" />
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex items-center justify-center px-6 py-16 lg:px-20">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
