import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/marketing/Logo";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const [t, tc, user] = await Promise.all([
    getTranslations("nav"),
    getTranslations("common"),
    getCurrentUser(),
  ]);

  const items = user
    ? [
        { href: "/catalog", label: t("catalog") },
        { href: "/orders", label: t("orders") },
        { href: "/chats", label: t("chats") },
        { href: "/dashboard", label: "Кабинет" },
      ]
    : [
        { href: "/catalog", label: t("catalog") },
        { href: "/orders", label: t("orders") },
        { href: "/become-executor", label: t("becomeExecutor") },
        { href: "/how-it-works", label: t("howItWorks") },
      ];

  // Подтянуть город для меню (тонкое поле — отдельный запрос только если есть user)
  let cityName = "";
  if (user) {
    const city = await db.city.findUnique({
      where: { id: user.cityId },
      select: { name: true },
    });
    cityName = city?.name ?? "";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-20">
        <Link href="/" aria-label="DrawLink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-fg-secondary transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu
              user={{
                nickname: user.nickname,
                role: user.role,
                verificationStatus: user.verificationStatus,
                cityName,
              }}
            />
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  {tc("signIn")}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" size="sm">
                  {tc("signUp")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
