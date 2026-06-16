"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ExamHeaderProps {
  mode: string;
  currentIndex: number;
  totalQuestions: number;
  progressPct: number;
  /** Overrides the default "3 / 20" counter — e.g. review mode */
  headerLabel?: string;
  timer?: ReactNode;
  subjectPills?: ReactNode;
  actions?: ReactNode;
  timeLow?: boolean;
  /** Align timer above the desktop question nav rail */
  alignTimerWithNav?: boolean;
  className?: string;
}

export function ExamHeader({
  mode,
  currentIndex,
  totalQuestions,
  progressPct,
  headerLabel,
  timer,
  subjectPills,
  actions,
  timeLow = false,
  alignTimerWithNav = false,
  className,
}: ExamHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-2 py-2 transition-colors duration-500",
        timeLow && "bg-rose-500/[0.06]",
        className
      )}
    >
      <div className="flex w-full items-center gap-3 lg:gap-6">
        <div className="flex min-w-0 w-full max-w-3xl flex-1 items-center gap-2 sm:gap-3">
          <Badge
            variant="outline"
            className={cn(
              "hidden shrink-0 capitalize sm:inline-flex",
              timeLow && "border-rose-500/25 text-rose-900 dark:text-rose-200"
            )}
          >
            {mode}
          </Badge>

          <Progress
            value={progressPct}
            className={cn(
              "h-1.5 min-w-0 flex-1",
              timeLow && "bg-rose-500/15 [&_[data-slot=progress-indicator]]:bg-rose-500"
            )}
          />

          {headerLabel ? (
            <span
              className={cn(
                "shrink-0 text-sm font-medium text-muted-foreground",
                timeLow && "text-rose-900/80 dark:text-rose-200/90"
              )}
            >
              {headerLabel}
            </span>
          ) : (
            <span
              className={cn(
                "shrink-0 text-sm font-medium tabular-nums text-muted-foreground",
                timeLow && "text-rose-900/80 dark:text-rose-200/90"
              )}
            >
              {currentIndex + 1} / {totalQuestions}
            </span>
          )}

          {actions}
        </div>

        {timer ? (
          <div
            className={cn(
              "ml-auto shrink-0",
              alignTimerWithNav && "lg:w-44 lg:justify-end lg:flex"
            )}
          >
            {timer}
          </div>
        ) : null}
      </div>

      {subjectPills && (
        <div className="w-full max-w-3xl">{subjectPills}</div>
      )}
    </div>
  );
}
