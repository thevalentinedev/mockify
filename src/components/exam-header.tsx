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
  autosaveLabel?: string;
  resumed?: boolean;
  /** Overrides the default "3 / 20" counter — e.g. review mode */
  headerLabel?: string;
  timer?: ReactNode;
  subjectPills?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ExamHeader({
  mode,
  currentIndex,
  totalQuestions,
  progressPct,
  autosaveLabel,
  resumed,
  headerLabel,
  timer,
  subjectPills,
  actions,
  className,
}: ExamHeaderProps) {
  return (
    <div
      className={cn(
        "space-y-2 py-2",
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant="outline" className="hidden capitalize sm:inline-flex">
          {mode}
        </Badge>

        <div className="min-w-[6rem] flex-1">
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {headerLabel ? (
          <span className="text-sm font-medium text-muted-foreground">
            {headerLabel}
          </span>
        ) : (
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {currentIndex + 1} / {totalQuestions}
          </span>
        )}

        {timer}

        {autosaveLabel && (
          <span
            className={cn(
              "hidden text-xs text-muted-foreground sm:inline",
              resumed && "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {autosaveLabel}
          </span>
        )}

        {actions}
      </div>

      {subjectPills && (
        <div className="mx-auto max-w-3xl">{subjectPills}</div>
      )}
    </div>
  );
}
