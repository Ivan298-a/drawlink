"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./SignOutButton";

type Props = {
  user: {
    nickname: string;
    role: "STUDENT" | "EXECUTOR" | "ADMIN";
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    cityName: string;
  };
};

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initials = user.nickname.substring(0, 2).toUpperCase();
  const roleLabel =
    user.role === "STUDENT" ? "Заказчик" : user.role === "EXECUTOR" ? "Исполнитель" : "Админ";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "btn-shimmer btn-shimmer-amber flex h-9 items-center gap-2 rounded-full border border-border-subtle bg-elevated pl-1 pr-3 transition-colors hover:border-border-strong",
          open && "border-border-strong"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
          {initials}
        </span>
        <span className="text-[13px] font-semibold text-fg">{user.nickname}</span>
        <svg
          viewBox="0 0 16 16"
          className={cn(
            "size-3.5 text-fg-muted transition-transform",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[14px] border border-border-subtle bg-surface shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-col gap-2 border-b border-border-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                {initials}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg">{user.nickname}</span>
                  {user.verificationStatus === "APPROVED" && (
                    <Badge variant="verified">Проверен</Badge>
                  )}
                </div>
                <span className="text-[11px] text-fg-muted">
                  {roleLabel} · {user.cityName}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col p-1.5">
            <MenuLink href="/dashboard" icon="◆" label="Кабинет" onSelect={() => setOpen(false)} />
            <MenuLink
              href={`/u/${user.nickname}`}
              icon="👤"
              label="Мой профиль"
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/settings"
              icon="⚙"
              label="Настройки и приватность"
              onSelect={() => setOpen(false)}
            />
            {user.role === "ADMIN" && (
              <>
                <div className="my-1 border-t border-border-subtle" />
                <MenuLink
                  href="/admin"
                  icon="🛡"
                  label="Админ-панель"
                  onSelect={() => setOpen(false)}
                  accent
                />
              </>
            )}
          </nav>

          <div className="border-t border-border-subtle p-1.5">
            <SignOutButton
              className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-[13px] font-medium text-[color:var(--color-danger)] transition-colors hover:bg-[color:oklch(0.62_0.20_25/0.12)]"
            >
              <span aria-hidden>↪</span>
              <span>Выйти</span>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onSelect,
  accent,
}: {
  href: string;
  icon: string;
  label: string;
  onSelect: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
        accent
          ? "text-brand hover:bg-[color:oklch(0.69_0.16_70/0.12)]"
          : "text-fg hover:bg-elevated"
      )}
    >
      <span className={accent ? "text-brand" : "text-fg-muted"} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
