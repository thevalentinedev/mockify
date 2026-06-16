import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  disabled?: boolean;
  /** Disable hover lift — exam surfaces, static content */
  static?: boolean;
  /** Tighter padding — resume banners, dense panels */
  compact?: boolean;
  onClick?: () => void;
}

export function BentoCard({
  children,
  className,
  selected,
  disabled,
  static: isStatic,
  compact,
  onClick,
}: BentoCardProps) {
  const Component = onClick ? "button" : "div";
  const isInteractive = Boolean(onClick && !disabled && !isStatic);

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 text-left shadow-sm backdrop-blur-sm",
        compact ? "p-4" : "p-5",
        isInteractive &&
          "transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md",
        !isInteractive && "transition-colors duration-200",
        selected && "border-primary ring-2 ring-primary/20 shadow-md",
        disabled &&
          "cursor-not-allowed opacity-50 motion-safe:hover:translate-y-0 motion-safe:hover:shadow-sm",
        onClick && !disabled && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
