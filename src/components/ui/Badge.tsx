import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeStyles = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold tracking-[0.04em] uppercase",
  {
    variants: {
      variant: {
        verified: "bg-brand text-brand-foreground",
        outline: "border border-border-strong text-fg-secondary",
        soft: "bg-[color:oklch(0.69_0.16_70/0.16)] text-brand",
        success:
          "bg-[color:oklch(0.70_0.16_145/0.18)] text-[color:var(--color-success)]",
        warning:
          "bg-[color:oklch(0.78_0.16_80/0.18)] text-[color:var(--color-warning)]",
        danger:
          "bg-[color:oklch(0.62_0.20_25/0.18)] text-[color:var(--color-danger)]",
        info: "bg-[color:oklch(0.60_0.16_250/0.18)] text-[color:var(--color-info)]",
        muted: "bg-elevated text-fg-secondary",
      },
    },
    defaultVariants: { variant: "muted" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ variant }), className)} {...props} />;
}
