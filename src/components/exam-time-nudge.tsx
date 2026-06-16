"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, X } from "lucide-react";

export interface ExamTimeNudgeProps {
  onDismiss: () => void;
  className?: string;
}

export function ExamTimeNudge({ onDismiss, className }: ExamTimeNudgeProps) {
  return (
    <div
      role="status"
      className={cn(
        "mx-auto flex w-full items-start gap-3 rounded-[var(--radius-surface)] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-950 dark:text-rose-100",
        className
      )}
    >
      <Clock className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium">Under 5 minutes left</p>
        <p className="text-rose-900/80 dark:text-rose-100/80">
          Pick up the pace — use Review when you&apos;re ready to check blanks
          before time runs out.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDismiss}
        className="shrink-0 text-rose-800 hover:bg-rose-500/15 hover:text-rose-950 dark:text-rose-200"
        aria-label="Dismiss time warning"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
