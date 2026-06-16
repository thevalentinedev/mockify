import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type PageShellVariant = "default" | "focus" | "minimal";

interface PageShellProps {
  variant?: PageShellVariant;
  children: ReactNode;
  className?: string;
}

const mainPadding: Record<PageShellVariant, string> = {
  default: "px-4 py-10 sm:px-6 sm:py-16",
  focus: "px-4 py-4 sm:px-6 sm:py-6",
  minimal: "px-4 py-8 sm:px-6 sm:py-10",
};

function SiteFooter({ compact }: { compact?: boolean }) {
  return (
    <footer
      className={cn(
        "mt-auto text-center text-xs text-muted-foreground",
        compact ? "py-4" : "py-6"
      )}
    >
      Pre-assessment practice
    </footer>
  );
}

function DefaultBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
    </>
  );
}

export function PageShell({
  variant = "default",
  children,
  className,
}: PageShellProps) {
  return (
    <>
      {variant === "default" && <DefaultBackground />}

      <main className={cn("flex-1", mainPadding[variant], className)}>
        {children}
      </main>

      {variant === "default" && <SiteFooter />}
      {variant === "minimal" && <SiteFooter compact />}
    </>
  );
}
