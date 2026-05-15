import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const dims = {
    sm: { box: "size-7", radius: "rounded-md", text: "text-base" },
    md: { box: "size-8", radius: "rounded-lg", text: "text-xl" },
    lg: { box: "size-10", radius: "rounded-lg", text: "text-2xl" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "bg-brand flex items-center justify-center",
          dims.box,
          dims.radius
        )}
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="size-4 stroke-brand-foreground" fill="none">
          <line x1="2" y1="4.5" x2="14" y2="4.5" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="2" y1="8.5" x2="11" y2="8.5" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="2" y1="12.5" x2="8" y2="12.5" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </div>
      <span
        className={cn("font-display font-bold -tracking-[0.02em] text-fg", dims.text)}
      >
        DrawLink
      </span>
    </div>
  );
}
