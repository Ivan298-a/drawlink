import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "btn-shimmer inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground hover:bg-brand-hover",
        secondary:
          "btn-shimmer-amber bg-elevated text-fg border border-border-subtle hover:bg-surface",
        ghost: "btn-shimmer-amber text-fg-secondary hover:text-fg hover:bg-elevated",
        danger:
          "btn-shimmer-amber bg-[color:oklch(0.62_0.20_25/0.14)] text-[color:var(--color-danger)] border border-[color:oklch(0.62_0.20_25/0.4)] hover:bg-[color:oklch(0.62_0.20_25/0.2)]",
        outline:
          "btn-shimmer-amber bg-transparent text-fg border border-border-strong hover:bg-elevated",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px] rounded-[10px]",
        md: "h-11 px-5 text-sm rounded-[10px]",
        lg: "h-14 px-7 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
