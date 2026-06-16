"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { surface } from "@/lib/surface";

function LegendSwatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "size-3 shrink-0 rounded-[4px] ring-1 ring-border/40",
          className
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

export interface ExamReviewSummaryProps {
  answeredCount: number;
  totalQuestions: number;
  flaggedCount: number;
  className?: string;
}

export function ExamReviewSummary({
  answeredCount,
  totalQuestions,
  flaggedCount,
  className,
}: ExamReviewSummaryProps) {
  const unansweredCount = totalQuestions - answeredCount;
  const allAnswered = unansweredCount === 0;

  return (
    <div className={cn(surface, "space-y-3 p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-semibold tabular-nums">
            {answeredCount} of {totalQuestions} answered
          </p>
          <p className="text-sm text-muted-foreground">
            {allAnswered
              ? "Every question has an answer. Submit when you’re ready."
              : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still blank — tap ${unansweredCount === 1 ? "it" : "them"} in the list to finish before you submit.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!allAnswered && (
            <Badge
              variant="outline"
              className="border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            >
              {unansweredCount} unanswered
            </Badge>
          )}
          {flaggedCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200"
            >
              {flaggedCount} flagged
            </Badge>
          )}
          {allAnswered && flaggedCount === 0 && (
            <Badge
              variant="outline"
              className="border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
            >
              Ready to submit
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <LegendSwatch label="Answered" className="bg-primary/8" />
        <LegendSwatch label="Unanswered" className="bg-muted/40" />
        <LegendSwatch
          label="Current"
          className="bg-primary/12 ring-2 ring-primary/25"
        />
        {flaggedCount > 0 && (
          <LegendSwatch label="Flagged" className="bg-amber-500/12" />
        )}
      </div>
    </div>
  );
}
