import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string | number; label: string; group?: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, hint, error, id, options, placeholder, ...props },
    ref
  ) => {
    const fieldId = id ?? props.name;
    // Group by `group` field if present
    const grouped = options.some((o) => o.group);
    const groups: Record<string, typeof options> = {};
    if (grouped) {
      for (const o of options) {
        const g = o.group ?? "—";
        (groups[g] ??= []).push(o);
      }
    }
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={fieldId} className="text-[13px] font-medium text-fg-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={fieldId}
            ref={ref}
            className={cn(
              "h-12 w-full appearance-none rounded-[10px] border bg-inset px-4 pr-10 text-[15px] text-fg",
              "transition-colors outline-none",
              error
                ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
                : "border-border-subtle focus:border-brand",
              className
            )}
            defaultValue={props.defaultValue ?? ""}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {grouped
              ? Object.entries(groups).map(([g, items]) => (
                  <optgroup key={g} label={g}>
                    {items.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
          </select>
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {error ? (
          <p className="text-xs text-[color:var(--color-danger)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-fg-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";
