"use client";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { Badge } from "@/components/ui/badge";
import {
  formatCorrectAnswer,
  isAnswerCorrect,
  isTextGradedQuestion,
} from "@/lib/answer-grader";
import { SolutionSteps } from "@/components/solution-steps";
import { getRemediationReason } from "@/lib/distractors";
import { FormatMathText } from "@/lib/format-math-text";
import { divider, shell } from "@/lib/surface";
import { hasSolutionContent } from "@/lib/solution";
import type { ExamAnswer, ShuffledQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  XCircle,
} from "lucide-react";

export interface ResultQuestionRowProps {
  index: number;
  question: ShuffledQuestion;
  answer: ExamAnswer | undefined;
  expanded: boolean;
  onToggle: () => void;
}

export function ResultQuestionRow({
  index,
  question,
  answer,
  expanded,
  onToggle,
}: ResultQuestionRowProps) {
  const isTextInput = isTextGradedQuestion(question);
  const isCorrect = isAnswerCorrect(question, answer);
  const remediation = getRemediationReason(question, answer);
  const hasExplanation = hasSolutionContent(question) || Boolean(remediation);

  return (
    <div className={cn(shell, "overflow-hidden")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/30 sm:p-4"
        aria-expanded={expanded}
      >
        {isCorrect ? (
          <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="size-5 shrink-0 text-red-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Question {index + 1}</span>
            {question.learningObjective ? (
              <Badge variant="outline" className="text-xs">
                {question.learningObjective}
              </Badge>
            ) : (
              question.topic && (
                <Badge variant="outline" className="text-xs">
                  {question.topic}
                </Badge>
              )
            )}
            {!expanded && (
              <span className="truncate text-xs text-muted-foreground">
                <FormatMathText>{question.text}</FormatMathText>
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3 px-3 pb-4 sm:px-4">
          <div className={divider} />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ConfidenceBadge confidence={question.answerConfidence} />
          </div>
          <p className="exam-question text-[1.05rem] sm:text-[1.1rem]">
            <FormatMathText>{question.text}</FormatMathText>
          </p>
          {isTextInput ? (
            <div className="space-y-1.5 text-sm">
              <p
                className={cn(
                  "rounded-[var(--radius-surface)] px-3 py-2",
                  isCorrect
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                )}
              >
                Your answer:{" "}
                <FormatMathText>{answer?.textAnswer ?? "—"}</FormatMathText>
              </p>
              {!isCorrect && (
                <p className="rounded-[var(--radius-surface)] bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                  Correct answer:{" "}
                  <FormatMathText>{formatCorrectAnswer(question)}</FormatMathText>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(question.options ?? []).map((opt, i) => {
                const isSelected = answer?.selectedIndex === i;
                const isCorrectOpt = question.correctIndex === i;

                return (
                  <p
                    key={i}
                    className={cn(
                      "exam-option rounded-[var(--radius-surface)] px-3 py-2",
                      isCorrectOpt &&
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      isSelected &&
                        !isCorrectOpt &&
                        "bg-red-500/10 text-red-700 dark:text-red-400",
                      !isCorrectOpt && !isSelected && "text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + i)}.{" "}
                    <FormatMathText>{opt}</FormatMathText>
                    {isCorrectOpt && " ✓"}
                    {isSelected && !isCorrectOpt && " (your answer)"}
                  </p>
                );
              })}
            </div>
          )}
          {hasExplanation && (
            <div
              className={cn(
                "space-y-2 rounded-[var(--radius-surface)] p-4 text-sm",
                isCorrect ? "bg-emerald-500/10" : "bg-amber-500/10"
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
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
