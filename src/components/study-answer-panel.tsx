"use client";

import { FormatMathText } from "@/lib/format-math-text";
import type { ExamAnswer, ShuffledQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

export interface StudyAnswerPanelProps {
  question: ShuffledQuestion;
  answer: ExamAnswer | undefined;
  className?: string;
}

export function StudyAnswerPanel({
  question,
  answer,
  className,
}: StudyAnswerPanelProps) {
  const isCorrect = answer?.selectedIndex === question.correctIndex;
  const hasExplanation =
    Boolean(question.explanation) ||
    (answer?.selectedIndex != null &&
      Boolean(question.wrongAnswerHints?.[String(answer.selectedIndex)]));

  if (!hasExplanation) {
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm",
          className
        )}
      >
        <p className="font-medium text-emerald-700 dark:text-emerald-400">
          Correct answer: {String.fromCharCode(65 + question.correctIndex)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl p-4 text-sm",
        isCorrect
          ? "border border-emerald-500/20 bg-emerald-500/5"
          : "border border-amber-500/20 bg-amber-500/5",
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <Lightbulb className="size-4" />
        {isCorrect ? "Why this is correct" : "Learn from this"}
      </div>
      {!isCorrect &&
        answer?.selectedIndex != null &&
        question.wrongAnswerHints?.[String(answer.selectedIndex)] && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Your answer: </span>
            <FormatMathText>
              {question.wrongAnswerHints[String(answer.selectedIndex)]}
            </FormatMathText>
          </p>
        )}
      {question.explanation && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Explanation: </span>
          <FormatMathText>{question.explanation}</FormatMathText>
        </p>
      )}
    </div>
  );
}
