"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { updatePrivacyAction } from "./actions";

type Defaults = {
  hideFromSameCity: boolean;
  hideFromSameVuz: boolean;
  showOnline: boolean;
};

export function PrivacyForm({ defaults }: { defaults: Defaults }) {
  const [hideCity, setHideCity] = useState(defaults.hideFromSameCity);
  const [hideVuz, setHideVuz] = useState(defaults.hideFromSameVuz);
  const [online, setOnline] = useState(defaults.showOnline);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(formData: FormData) {
    formData.set("hideFromSameCity", hideCity ? "on" : "");
    formData.set("hideFromSameVuz", hideVuz ? "on" : "");
    formData.set("showOnline", online ? "on" : "");
    setSaved(false);
    startTransition(async () => {
      const result = await updatePrivacyAction(formData);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-1">
      <ToggleRow
        title="Скрывать пользователей из моего города"
        description="Защита от случайного пересечения с одногруппниками. Включено по умолчанию."
        checked={hideCity}
        onChange={setHideCity}
      />
      <ToggleRow
        title="Скрывать пользователей из моего ВУЗа"
        description="Дополнительная защита, если другой студент указал тот же ВУЗ."
        checked={hideVuz}
        onChange={setHideVuz}
      />
      <ToggleRow
        title="Показывать статус «онлайн»"
        description="Зелёный индикатор у никнейма. Можно отключить."
        checked={online}
        onChange={setOnline}
      />

      <div className="mt-5 flex items-center justify-between">
        <p
          className={cn(
            "text-[13px] font-medium transition-opacity",
            saved
              ? "text-[color:var(--color-success)] opacity-100"
              : "opacity-0"
          )}
          role="status"
        >
          ✓ Сохранено
        </p>
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border-subtle py-4 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="text-[14px] font-semibold text-fg">{title}</span>
        <span className="text-[12px] text-fg-secondary">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors p-0.5",
          checked ? "bg-brand" : "bg-border-strong"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[20px]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
