"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  LayoutGrid,
} from "lucide-react";

export type ExamNavBarVariant = "exam" | "review";

export interface ExamNavBarProps {
  variant?: ExamNavBarVariant;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isFlagged?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onFlag?: () => void;
  onReview?: () => void;
  onBackToExam?: () => void;
  onSubmit?: () => void;
  showQuestionsNav?: boolean;
  onOpenQuestions?: () => void;
  hideReview?: boolean;
  className?: string;
}

export function ExamNavBar({
  variant = "exam",
  canGoPrevious = true,
  canGoNext = true,
  isFlagged = false,
  nextLabel = "Next",
  submitLabel = "Submit",
  onPrevious,
  onNext,
  onFlag,
  onReview,
  onBackToExam,
  onSubmit,
  showQuestionsNav = false,
  onOpenQuestions,
  hideReview = false,
  className,
}: ExamNavBarProps) {
  return (
    <nav
      aria-label="Exam navigation"
      className={cn("fixed inset-x-0 bottom-0 z-40 soft-chrome soft-glass-bottom pb-[env(safe-area-inset-bottom)]", className)}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
        {variant === "review" ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onBackToExam}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to exam</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button type="button" onClick={onSubmit} className="gap-2 flex-1 sm:flex-none">
              <CheckCircle2 className="size-4" />
              {submitLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            <div className="flex items-center gap-1">
              {showQuestionsNav && onOpenQuestions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onOpenQuestions}
                  className="gap-1 lg:hidden"
                  aria-label="Open question list"
                >
                  <LayoutGrid className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant={isFlagged ? "secondary" : "ghost"}
                size="sm"
                onClick={onFlag}
                className="gap-1.5"
              >
                <Flag className="size-4" />
                <span className="hidden sm:inline">
                  {isFlagged ? "Flagged" : "Flag"}
                </span>
              </Button>
              {!hideReview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReview}
                  className="gap-1.5"
                >
                  <span className="hidden sm:inline">Review</span>
                  <span className="sm:hidden">Rev</span>
                </Button>
              )}
            </div>

            <Button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="gap-1.5"
            >
              {nextLabel}
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
