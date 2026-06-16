"use client";

import {
  answerFeedback,
  getCorrectPhrase,
  getIncorrectPhrase,
} from "@/lib/motivation";
import { cn } from "@/lib/utils";
import { Lightbulb, Sparkles } from "lucide-react";

export interface AnswerFeedbackBannerProps {
  isCorrect: boolean;
  seed: string;
  className?: string;
}

export function AnswerFeedbackBanner({
  isCorrect,
  seed,
  className,
}: AnswerFeedbackBannerProps) {
  const message = isCorrect
    ? getCorrectPhrase(seed)
    : getIncorrectPhrase(seed);

  return (
    <div
      className={cn(
        "feedback-enter flex items-start gap-2.5 rounded-[var(--radius-surface)] px-3.5 py-3 text-sm font-medium",
        isCorrect ? answerFeedback.celebratePanel : answerFeedback.growthPanel,
        isCorrect
          ? "text-emerald-800 dark:text-emerald-300"
          : "text-amber-900 dark:text-amber-200",
        className
      )}
      role="status"
    >
      {isCorrect ? (
        <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      <span>{message}</span>
    </div>
  );
}
