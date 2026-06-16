"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderMode = "default" | "focus" | "results" | "admin";

function headerModeFromPath(pathname: string): HeaderMode {
  if (pathname.startsWith("/exam")) return "focus";
  if (pathname.startsWith("/results")) return "results";
  if (pathname.startsWith("/import")) return "admin";
  return "default";
}

const trailingLabel: Record<HeaderMode, string | null> = {
  default: null,
  focus: "Exam",
  results: "Results",
  admin: "Import",
};

export function SiteHeader() {
  const pathname = usePathname();
  const mode = headerModeFromPath(pathname);
  const label = trailingLabel[mode];

  return (
    <header className={cn("sticky top-0 z-50 soft-chrome")}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          {mode === "default" && (
            <span className="hidden truncate sm:inline">Mock Exam Prep</span>
          )}
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {label && (
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
