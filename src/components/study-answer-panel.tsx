"use client";

import {
  formatCorrectAnswer,
  isAnswerCorrect,
  isTextGradedQuestion,
} from "@/lib/answer-grader";
import { SolutionSteps } from "@/components/solution-steps";
import { getRemediationReason } from "@/lib/distractors";
import { FormatMathText } from "@/lib/format-math-text";
import { hasSolutionContent } from "@/lib/solution";
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
  const isTextInput = isTextGradedQuestion(question);
  const isCorrect = isAnswerCorrect(question, answer);
  const remediation = getRemediationReason(question, answer);
  const hasExplanation = hasSolutionContent(question) || Boolean(remediation);

  if (!hasExplanation) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-surface)] bg-emerald-500/10 p-4 text-sm",
          className
        )}
      >
        <p className="font-medium text-emerald-700 dark:text-emerald-400">
          Correct answer:{" "}
          <FormatMathText>{formatCorrectAnswer(question)}</FormatMathText>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-[var(--radius-surface)] p-4 text-sm",
        isCorrect ? "bg-emerald-500/10" : "bg-amber-500/10",
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <Lightbulb className="size-4" />
        {isCorrect ? "Why this is correct" : "Learn from this"}
      </div>
      {!isCorrect && remediation && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            {isTextInput ? "Why this is wrong: " : "Your mistake: "}
          </span>
          <FormatMathText>{remediation}</FormatMathText>
        </p>
      )}
      <SolutionSteps
        question={question}
        label={isCorrect ? "Solution" : "Correct solution"}
        progressive
      />
    </div>
  );
}
