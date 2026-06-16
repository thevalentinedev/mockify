"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassScrim, shell } from "@/lib/surface";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

export interface ExamSubmitConfirmDialogProps {
  open: boolean;
  unansweredCount: number;
  totalQuestions: number;
  subjectName: string;
  isLastSubject: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExamSubmitConfirmDialog({
  open,
  unansweredCount,
  totalQuestions,
  subjectName,
  isLastSubject,
  onCancel,
  onConfirm,
}: ExamSubmitConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-confirm-title"
    >
      <button
        type="button"
        className={cn("absolute inset-0", glassScrim)}
        aria-label="Close"
        onClick={onCancel}
      />
      <div className={cn("relative w-full max-w-md space-y-4 p-5", shell)}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 id="submit-confirm-title" className="font-semibold">
              Submit with blank answers?
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {unansweredCount} of {totalQuestions}
              </span>{" "}
              {subjectName} question{unansweredCount === 1 ? "" : "s"}{" "}
              {unansweredCount === 1 ? "doesn't" : "don't"} have an answer yet.
            </p>
            <p className="text-sm text-muted-foreground">
              {isLastSubject
                ? "Unanswered questions will count as incorrect."
                : `You'll move on to the next subject. You can come back to ${subjectName} only by retaking later.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Keep reviewing
          </Button>
          <Button type="button" onClick={onConfirm}>
            Submit anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
