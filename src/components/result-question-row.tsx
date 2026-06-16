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
import {
  answerFeedback,
  insightSectionTitle,
  remediationLabel,
  solutionLabel,
} from "@/lib/motivation";
import { divider, shell } from "@/lib/surface";
import { hasSolutionContent } from "@/lib/solution";
import type { ExamAnswer, ShuffledQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Sparkles,
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
          <Lightbulb className="size-5 shrink-0 text-violet-500" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Question {index + 1}</span>
            {!isCorrect && (
              <Badge
                variant="outline"
                className="border-violet-500/25 bg-violet-500/8 text-xs text-violet-700 dark:text-violet-300"
              >
                Review
              </Badge>
            )}
            {isCorrect && (
              <Badge
                variant="outline"
                className="border-emerald-500/25 bg-emerald-500/8 text-xs text-emerald-700 dark:text-emerald-400"
              >
                <Sparkles className="mr-1 size-3" />
                Got it
              </Badge>
            )}
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
                  isCorrect ? answerFeedback.correct : answerFeedback.incorrect
                )}
              >
                Your answer:{" "}
                <FormatMathText>{answer?.textAnswer ?? "—"}</FormatMathText>
              </p>
              {!isCorrect && (
                <p className={cn("rounded-[var(--radius-surface)] px-3 py-2", answerFeedback.correct)}>
                  Answer:{" "}
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
                      isCorrectOpt && answerFeedback.correct,
                      isSelected &&
                        !isCorrectOpt &&
                        answerFeedback.incorrect,
                      !isCorrectOpt && !isSelected && "text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + i)}.{" "}
                    <FormatMathText>{opt}</FormatMathText>
                    {isCorrectOpt && " ✓"}
                    {isSelected && !isCorrectOpt && " (your pick)"}
                  </p>
                );
              })}
            </div>
          )}
          {hasExplanation && (
            <div
              className={cn(
                "space-y-2 rounded-[var(--radius-surface)] p-4 text-sm",
                isCorrect ? answerFeedback.celebratePanel : answerFeedback.growthPanel
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <Lightbulb className="size-4" />
                {insightSectionTitle(isCorrect)}
              </div>
              {!isCorrect && remediation && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {remediationLabel(isTextInput)}
                  </span>
                  <FormatMathText>{remediation}</FormatMathText>
                </p>
              )}
              <SolutionSteps
                question={question}
                label={solutionLabel(isCorrect)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
