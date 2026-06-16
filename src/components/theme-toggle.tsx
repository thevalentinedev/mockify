"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { surface } from "@/lib/surface";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return <div className={cn("size-8", className)} aria-hidden />;
  }

  const active = resolvedTheme ?? theme ?? "light";

  return (
    <div
      className={cn(surface, "flex items-center p-0.5", className)}
      role="group"
      aria-label="Theme"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "size-7 rounded-[var(--radius-surface)]",
          active === "light" && "bg-background/80 text-foreground shadow-sm"
        )}
        onClick={() => setTheme("light")}
        aria-pressed={active === "light"}
        aria-label="Light mode"
      >
        <Sun className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "size-7 rounded-[var(--radius-surface)]",
          active === "dark" && "bg-background/80 text-foreground shadow-sm"
        )}
        onClick={() => setTheme("dark")}
        aria-pressed={active === "dark"}
        aria-label="Dark mode"
      >
        <Moon className="size-3.5" />
      </Button>
    </div>
  );
}
