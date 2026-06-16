"use client";

import { AnswerFeedbackBanner } from "@/components/answer-feedback-banner";
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
      <div className={cn("space-y-3", className)}>
        <AnswerFeedbackBanner isCorrect={isCorrect} seed={question.id} />
        <div
          className={cn(
            "rounded-[var(--radius-surface)] p-4 text-sm",
            answerFeedback.correct
          )}
        >
          <p className="font-medium">
            Answer:{" "}
            <FormatMathText>{formatCorrectAnswer(question)}</FormatMathText>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <AnswerFeedbackBanner isCorrect={isCorrect} seed={question.id} />

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
          progressive
        />
      </div>
    </div>
  );
}
