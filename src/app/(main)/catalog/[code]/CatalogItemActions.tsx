"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  getCatalogOriginalUrlAction,
  purchaseCatalogItemAction,
} from "../actions";

type Props = {
  itemId: string;
  isAuthor: boolean;
  alreadyBought: boolean;
  loggedIn: boolean;
};

export function CatalogItemActions({
  itemId,
  isAuthor,
  alreadyBought,
  loggedIn,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buy() {
    if (!loggedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("itemId", itemId);
    startTransition(async () => {
      const result = await purchaseCatalogItemAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.redirect) router.push(result.redirect);
      else router.refresh();
    });
  }

  async function download() {
    setError(null);
    const result = await getCatalogOriginalUrlAction(itemId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const url = result.data?.url as string | undefined;
    if (url) window.open(url, "_blank", "noopener");
  }

  if (isAuthor) {
    return (
      <div className="flex flex-col gap-2">
        <Link href={`/catalog/${itemId}/edit`} className="contents">
          <Button variant="secondary" size="lg" className="w-full">
            Редактировать
          </Button>
        </Link>
        <p className="text-center text-[12px] text-fg-muted">
          Это твоя работа — покупка недоступна
        </p>
      </div>
    );
  }

  if (alreadyBought) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={download}
          className="w-full"
        >
          Скачать оригинал
        </Button>
        <p className="text-center text-[12px] text-fg-muted">
          Ссылка работает 15 минут. Можно запросить заново.
        </p>
        {error && (
          <p className="text-center text-[12px] text-[color:var(--color-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={buy}
        disabled={pending}
        className="w-full"
      >
        {pending ? "Обрабатываем…" : "Купить через escrow"}
      </Button>
      {error && (
        <p className="text-center text-[12px] text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
