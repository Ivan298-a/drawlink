import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = { title: "Админ — DrawLink" };

const menu = [
  { href: "/admin", label: "Дашборд", icon: "◆" },
  { href: "/admin/verifications", label: "Верификация", icon: "✓", countKey: "pendingVerifications" as const },
  { href: "/admin/disputes", label: "Споры", icon: "⚠", countKey: "openDisputes" as const },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  const [pendingVerifications, openDisputes] = await Promise.all([
    db.user.count({
      where: { role: "EXECUTOR", verificationStatus: "PENDING" },
    }),
    db.dispute.count({ where: { status: "OPEN" } }),
  ]);
  const counts = { pendingVerifications, openDisputes };

  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-6 border-r border-border-subtle bg-inset p-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
            <svg viewBox="0 0 16 16" className="size-3.5 stroke-current" fill="none">
              <line x1="2" y1="4.5" x2="14" y2="4.5" strokeWidth="1.5" />
              <line x1="2" y1="8.5" x2="11" y2="8.5" strokeWidth="1.5" />
              <line x1="2" y1="12.5" x2="8" y2="12.5" strokeWidth="1.5" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold -tracking-[0.02em] text-fg">
              DrawLink
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
              Admin
            </span>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {menu.map((item) => {
            const count = item.countKey ? counts[item.countKey] : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-elevated hover:text-fg"
              >
                <span className="flex items-center gap-3">
                  <span className="text-fg-muted" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                {count != null && count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-foreground">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle pt-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
              {user.nickname.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[12px] font-semibold text-fg">
                {user.nickname}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">
                Админ
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-[8px] border border-border-subtle px-3 py-2 text-center text-[12px] font-medium text-fg-secondary transition-colors hover:text-fg"
          >
            ← На сайт
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-[8px] px-3 py-2 text-left text-[12px] font-medium text-[color:var(--color-danger)] transition-colors hover:bg-[color:oklch(0.62_0.20_25/0.12)]"
            >
              Выйти
            </button>
          </form>
        </div>
      </aside>

      <main className="bg-bg">{children}</main>
    </div>
  );
}
