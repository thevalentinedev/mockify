"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassScrim, glassSheet, shell } from "@/lib/surface";
import type { ExamAnswer } from "@/types/exam";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** Show sticky nav rail / sheet when a section has at least this many questions */
export const EXAM_NAV_MIN_QUESTIONS = 20;

/** Use grouped + compact navigation at this count and above */
export const LARGE_QUESTION_NAV_THRESHOLD = 50;

export const QUESTION_NAV_GROUP_SIZE = 20;

export type QuestionTileState = "current" | "flagged" | "answered" | "empty";
export type QuestionNavFilter = "all" | "unanswered" | "flagged";

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

export function isQuestionAnswered(
  questionId: string,
  answers: ExamAnswer[]
): boolean {
  const ans = answers.find((a) => a.questionId === questionId);
  return (
    (ans?.selectedIndex !== null && ans?.selectedIndex !== undefined) ||
    Boolean(ans?.textAnswer?.trim())
  );
}

function tileClassName(state: QuestionTileState, compact?: boolean): string {
  return cn(
    "rounded-[var(--radius-surface)] text-center font-medium transition-all",
    compact ? "p-1.5 text-xs" : "p-2.5 text-sm sm:p-3",
    state === "current" &&
      "bg-primary/12 text-primary ring-2 ring-primary/25 shadow-sm",
    state === "flagged" && "bg-amber-500/12 text-amber-800 dark:text-amber-300",
    state === "answered" && "bg-primary/8 text-foreground",
    state === "empty" && "bg-muted/40 text-muted-foreground"
  );
}

function QuestionTile({
  index,
  questionId,
  currentIndex,
  answers,
  flaggedQuestionIds,
  onSelect,
  compact,
  buttonRef,
}: {
  index: number;
  questionId: string;
  currentIndex: number;
  answers: ExamAnswer[];
  flaggedQuestionIds: string[];
  onSelect: (index: number) => void;
  compact?: boolean;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  const answered = isQuestionAnswered(questionId, answers);
  const flagged = flaggedQuestionIds.includes(questionId);
  const state = getQuestionTileState(index, currentIndex, answered, flagged);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`Question ${index + 1}${
        state === "current"
          ? ", current"
          : flagged
            ? ", flagged"
            : answered
              ? ", answered"
              : ", unanswered"
      }`}
      aria-current={state === "current" ? "step" : undefined}
      className={tileClassName(state, compact)}
    >
      {index + 1}
    </button>
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
  compact?: boolean;
  indices?: number[];
  currentButtonRef?: (el: HTMLButtonElement | null) => void;
}

export function ExamQuestionGrid({
  questionCount,
  currentIndex,
  answers,
  questionIds,
  flaggedQuestionIds,
  onSelect,
  className,
  compact,
  indices,
  currentButtonRef,
}: ExamQuestionGridProps) {
  const visibleIndices = indices ?? Array.from({ length: questionCount }, (_, i) => i);

  return (
    <div
      className={cn(
        "grid gap-1.5 sm:gap-2",
        compact ? "grid-cols-5" : "grid-cols-5",
        className
      )}
    >
      {visibleIndices.map((i) => (
        <QuestionTile
          key={questionIds[i] ?? i}
          index={i}
          questionId={questionIds[i]}
          currentIndex={currentIndex}
          answers={answers}
          flaggedQuestionIds={flaggedQuestionIds}
          onSelect={onSelect}
          compact={compact}
          buttonRef={i === currentIndex ? currentButtonRef : undefined}
        />
      ))}
    </div>
  );
}

function QuestionNavFilters({
  filter,
  onFilterChange,
  unansweredCount,
  flaggedCount,
}: {
  filter: QuestionNavFilter;
  onFilterChange: (filter: QuestionNavFilter) => void;
  unansweredCount: number;
  flaggedCount: number;
}) {
  const chips: { id: QuestionNavFilter; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "unanswered", label: "Blank", count: unansweredCount },
  ];
  if (flaggedCount > 0) {
    chips.push({ id: "flagged", label: "Flagged", count: flaggedCount });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <Button
          key={chip.id}
          type="button"
          variant={filter === chip.id ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onFilterChange(chip.id)}
        >
          {chip.label}
          {chip.count !== undefined ? ` (${chip.count})` : ""}
        </Button>
      ))}
    </div>
  );
}

function GroupedQuestionGrid({
  questionCount,
  groupSize,
  compact,
  currentButtonRef,
  ...gridProps
}: ExamQuestionGridProps & { groupSize: number }) {
  const groups = useMemo(() => {
    const result: { label: string; indices: number[] }[] = [];
    for (let start = 0; start < questionCount; start += groupSize) {
      const end = Math.min(start + groupSize, questionCount);
      result.push({
        label: `${start + 1}–${end}`,
        indices: Array.from({ length: end - start }, (_, offset) => start + offset),
      });
    }
    return result;
  }, [questionCount, groupSize]);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <ExamQuestionGrid
            {...gridProps}
            questionCount={questionCount}
            compact={compact}
            indices={group.indices}
            currentButtonRef={currentButtonRef}
            className="grid-cols-5"
          />
        </section>
      ))}
    </div>
  );
}

interface ExamQuestionNavPanelProps {
  questionCount: number;
  currentIndex: number;
  answers: ExamAnswer[];
  questionIds: string[];
  flaggedQuestionIds: string[];
  onSelect: (index: number) => void;
}

function ExamQuestionNavPanel({
  questionCount,
  currentIndex,
  answers,
  questionIds,
  flaggedQuestionIds,
  onSelect,
}: ExamQuestionNavPanelProps) {
  const [filter, setFilter] = useState<QuestionNavFilter>("all");
  const currentRef = useRef<HTMLButtonElement | null>(null);
  const compact = questionCount >= LARGE_QUESTION_NAV_THRESHOLD;

  const answeredCount = questionIds.filter((id) =>
    isQuestionAnswered(id, answers)
  ).length;
  const unansweredCount = questionCount - answeredCount;
  const flaggedCount = questionIds.filter((id) =>
    flaggedQuestionIds.includes(id)
  ).length;

  const filteredIndices = useMemo(() => {
    return Array.from({ length: questionCount }, (_, i) => i).filter((i) => {
      const id = questionIds[i];
      if (filter === "unanswered") {
        return !isQuestionAnswered(id, answers);
      }
      if (filter === "flagged") {
        return flaggedQuestionIds.includes(id);
      }
      return true;
    });
  }, [questionCount, questionIds, answers, flaggedQuestionIds, filter]);

  useEffect(() => {
    if (filter !== "all") return;
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex, filter]);

  const gridProps = {
    questionCount,
    currentIndex,
    answers,
    questionIds,
    flaggedQuestionIds,
    onSelect,
    compact,
    currentButtonRef: (el: HTMLButtonElement | null) => {
      currentRef.current = el;
    },
  };

  return (
    <>
      <div className="mb-3 space-y-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Questions</p>
          <p className="text-xs text-muted-foreground">
            {answeredCount}/{questionCount} answered
          </p>
        </div>
        {questionCount >= EXAM_NAV_MIN_QUESTIONS && (
          <QuestionNavFilters
            filter={filter}
            onFilterChange={setFilter}
            unansweredCount={unansweredCount}
            flaggedCount={flaggedCount}
          />
        )}
      </div>

      {filter !== "all" ? (
        filteredIndices.length > 0 ? (
          <ExamQuestionGrid
            {...gridProps}
            indices={filteredIndices}
            className={compact ? "grid-cols-5" : "grid-cols-5"}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {filter === "unanswered"
              ? "Every question has an answer."
              : "No flagged questions."}
          </p>
        )
      ) : compact ? (
        <GroupedQuestionGrid
          {...gridProps}
          groupSize={QUESTION_NAV_GROUP_SIZE}
        />
      ) : (
        <ExamQuestionGrid {...gridProps} className="grid-cols-4" />
      )}
    </>
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
  className,
  ...panelProps
}: ExamQuestionNavRailProps) {
  return (
    <aside
      aria-label="Question navigator"
      className={cn(
        "sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto p-3",
        shell,
        className
      )}
    >
      <ExamQuestionNavPanel {...panelProps} />
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
  onSelect,
  ...panelProps
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

  function handleSelect(index: number) {
    onSelect(index);
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className={cn("absolute inset-0", glassScrim)}
        aria-label="Close question list"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[var(--radius-shell)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
          glassSheet
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Tap to jump</p>
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
        <ExamQuestionNavPanel {...panelProps} onSelect={handleSelect} />
      </div>
    </div>
  );
}
