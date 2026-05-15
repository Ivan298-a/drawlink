import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={fieldId} className="text-[13px] font-medium text-fg-secondary">
            {label}
          </label>
        )}
        <input
          id={fieldId}
          ref={ref}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-inset px-4 text-[15px] text-fg placeholder:text-fg-muted",
            "transition-colors outline-none",
            error
              ? "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)]"
              : "border-border-subtle focus:border-brand",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[color:var(--color-danger)]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-fg-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
