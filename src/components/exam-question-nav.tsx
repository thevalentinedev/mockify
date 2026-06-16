"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamAnswer } from "@/types/exam";
import { X } from "lucide-react";
import { useEffect } from "react";

/** Show sticky nav rail / sheet when a section has at least this many questions */
export const EXAM_NAV_MIN_QUESTIONS = 20;

export type QuestionTileState = "current" | "flagged" | "answered" | "empty";

export function getQuestionTileState(
  index: number,
  currentIndex: number,
  isAnswered: boolean,
  isFlagged: boolean
): QuestionTileState {
  if (index === currentIndex) return "current";
  if (isFlagged) return "flagged";
  if (isAnswered) return "answered";
  return "empty";
}

function isQuestionAnswered(
  questionId: string,
  answers: ExamAnswer[]
): boolean {
  const ans = answers.find((a) => a.questionId === questionId);
  return ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;
}

function tileClassName(state: QuestionTileState): string {
  return cn(
    "rounded-xl border p-2.5 text-center text-sm font-medium transition-all hover:shadow-sm sm:p-3",
    state === "current" &&
      "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm",
    state === "flagged" && "border-amber-500/40 bg-amber-500/10",
    state === "answered" && "border-primary/30 bg-primary/5",
    state === "empty" && "border-dashed border-muted-foreground/30 bg-muted/20"
  );
}

export interface ExamQuestionGridProps {
  questionCount: number;
  currentIndex: number;
  answers: ExamAnswer[];
  questionIds: string[];
  flaggedQuestionIds: string[];
  onSelect: (index: number) => void;
  className?: string;
}

export function ExamQuestionGrid({
  questionCount,
  currentIndex,
  answers,
  questionIds,
  flaggedQuestionIds,
  onSelect,
  className,
}: ExamQuestionGridProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-2", className)}>
      {Array.from({ length: questionCount }, (_, i) => {
        const questionId = questionIds[i];
        const answered = isQuestionAnswered(questionId, answers);
        const flagged = flaggedQuestionIds.includes(questionId);
        const state = getQuestionTileState(i, currentIndex, answered, flagged);

        return (
          <button
            key={questionId ?? i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Question ${i + 1}${
              state === "current"
                ? ", current"
                : flagged
                  ? ", flagged"
                  : answered
                    ? ", answered"
                    : ", unanswered"
            }`}
            aria-current={state === "current" ? "step" : undefined}
            className={tileClassName(state)}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export interface ExamQuestionNavRailProps {
  questionCount: number;
  currentIndex: number;
  answers: ExamAnswer[];
  questionIds: string[];
  flaggedQuestionIds: string[];
  onSelect: (index: number) => void;
  className?: string;
}

export function ExamQuestionNavRail({
  questionCount,
  currentIndex,
  answers,
  questionIds,
  flaggedQuestionIds,
  onSelect,
  className,
}: ExamQuestionNavRailProps) {
  const answeredCount = questionIds.filter((id) =>
    isQuestionAnswered(id, answers)
  ).length;

  return (
    <aside
      aria-label="Question navigator"
      className={cn(
        "sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto rounded-xl border bg-card/80 p-3 backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-3 space-y-0.5">
        <p className="text-sm font-semibold">Questions</p>
        <p className="text-xs text-muted-foreground">
          {answeredCount}/{questionCount} answered
        </p>
      </div>
      <ExamQuestionGrid
        questionCount={questionCount}
        currentIndex={currentIndex}
        answers={answers}
        questionIds={questionIds}
        flaggedQuestionIds={flaggedQuestionIds}
        onSelect={onSelect}
        className="grid-cols-4"
      />
    </aside>
  );
}

export interface ExamQuestionNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionCount: number;
  currentIndex: number;
  answers: ExamAnswer[];
  questionIds: string[];
  flaggedQuestionIds: string[];
  onSelect: (index: number) => void;
}

export function ExamQuestionNavSheet({
  open,
  onOpenChange,
  questionCount,
  currentIndex,
  answers,
  questionIds,
  flaggedQuestionIds,
  onSelect,
}: ExamQuestionNavSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const answeredCount = questionIds.filter((id) =>
    isQuestionAnswered(id, answers)
  ).length;

  function handleSelect(index: number) {
    onSelect(index);
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        aria-label="Close question list"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Questions</h2>
            <p className="text-sm text-muted-foreground">
              {answeredCount}/{questionCount} answered · tap to jump
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>
        <ExamQuestionGrid
          questionCount={questionCount}
          currentIndex={currentIndex}
          answers={answers}
          questionIds={questionIds}
          flaggedQuestionIds={flaggedQuestionIds}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
