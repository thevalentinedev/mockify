import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function BentoCard({
  children,
  className,
  selected,
  disabled,
  onClick,
}: BentoCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        selected && "border-primary ring-2 ring-primary/20 shadow-md",
        disabled && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-sm",
        onClick && !disabled && "cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}
