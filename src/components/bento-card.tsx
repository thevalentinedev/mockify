import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { shell, shellSelected } from "@/lib/surface";

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
  /** For toggle-style cards (e.g. multi-select subjects) */
  ariaPressed?: boolean;
}

export function BentoCard({
  children,
  className,
  selected,
  disabled,
  static: isStatic,
  compact,
  onClick,
  ariaPressed,
}: BentoCardProps) {
  const Component = onClick ? "button" : "div";
  const isInteractive = Boolean(onClick && !disabled && !isStatic);

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={onClick ? ariaPressed : undefined}
      className={cn(
        shell,
        "group relative overflow-hidden text-left",
        compact ? "p-4" : "p-5",
        isInteractive &&
          "transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[var(--shadow-soft-lg)]",
        !isInteractive && "transition-[background,box-shadow] duration-200",
        selected && shellSelected,
        disabled &&
          "cursor-not-allowed opacity-50 motion-safe:hover:translate-y-0 motion-safe:hover:shadow-[var(--shadow-soft)]",
        onClick && !disabled && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
