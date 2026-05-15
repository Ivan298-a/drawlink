"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { updateCityAction } from "./actions";

type Option = { value: number; label: string; group: string };

export function CityForm({
  currentCityId,
  cities,
}: {
  currentCityId: number;
  cities: Option[];
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(formData: FormData) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateCityAction(formData);
      if (!result.ok) {
        setServerError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Select
          name="cityId"
          label="Город"
          options={cities}
          defaultValue={currentCityId}
        />
      </div>
      <Button type="submit" variant="primary" size="md" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить"}
      </Button>
      {saved && (
        <span className="text-[13px] font-medium text-[color:var(--color-success)]">
          ✓ Сохранено
        </span>
      )}
      {serverError && (
        <span className="text-[13px] font-medium text-[color:var(--color-danger)]">
          {serverError}
        </span>
      )}
    </form>
  );
}
