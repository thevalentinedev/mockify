"use client";

import { useState } from "react";
import { formatCorrectAnswer } from "@/lib/answer-grader";
import { FormatMathText } from "@/lib/format-math-text";
import {
  getDisplayedFinalAnswer,
  getQuestionSolution,
} from "@/lib/solution";
import type { ShuffledQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export interface SolutionStepsProps {
  question: ShuffledQuestion;
  className?: string;
  label?: string;
  /** Reveal solution steps one at a time (study mode) */
  progressive?: boolean;
}

export function SolutionSteps({
  question,
  className,
  label = "Solution",
  progressive = false,
}: SolutionStepsProps) {
  const solution = getQuestionSolution(question);
  const finalAnswer =
    getDisplayedFinalAnswer(question) || formatCorrectAnswer(question);
  const stepCount = solution?.steps.length ?? 0;
  const [revealedCount, setRevealedCount] = useState(
    progressive ? 0 : stepCount
  );

  if (solution?.steps.length) {
    const allRevealed = revealedCount >= stepCount;
    const visibleSteps = solution.steps.slice(0, revealedCount);

    return (
      <div className={cn("space-y-2", className)}>
        <p className="font-medium text-foreground">{label}</p>

        {progressive && revealedCount === 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setRevealedCount(1)}
          >
            Show first step
          </Button>
        ) : (
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            {visibleSteps.map((step, index) => (
              <li key={index} className="exam-option">
                <FormatMathText>{step}</FormatMathText>
              </li>
            ))}
          </ol>
        )}

        {progressive && revealedCount > 0 && !allRevealed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              setRevealedCount((count) => Math.min(count + 1, stepCount))
            }
          >
            Next step
            <ChevronRight className="size-3.5" />
          </Button>
        )}

        {finalAnswer && (!progressive || allRevealed) && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Final answer: </span>
            <FormatMathText>{finalAnswer}</FormatMathText>
          </p>
        )}
      </div>
    );
  }

  if (question.explanation) {
    return (
      <p className={cn("text-muted-foreground", className)}>
        <span className="font-medium text-foreground">{label}: </span>
        <FormatMathText>{question.explanation}</FormatMathText>
      </p>
    );
  }

  return null;
}
