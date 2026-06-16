"use client";

import { useEffect } from "react";

interface UseExamKeyboardOptions {
  enabled: boolean;
  optionCount: number;
  hasSelectedAnswer?: boolean;
  /** Study mode: Enter advances only after reveal; N/→ blocked until revealed */
  awaitingReveal?: boolean;
  onSelectOption: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRevealAnswer?: () => void;
  onReview: () => void;
  onToggleFlag: () => void;
}

export function useExamKeyboard({
  enabled,
  optionCount,
  hasSelectedAnswer = false,
  awaitingReveal = false,
  onSelectOption,
  onPrevious,
  onNext,
  onRevealAnswer,
  onReview,
  onToggleFlag,
}: UseExamKeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key >= "1" && key <= "4") {
        const index = parseInt(key, 10) - 1;
        if (index < optionCount) {
          event.preventDefault();
          onSelectOption(index);
        }
        return;
      }

      if (key === "enter" && hasSelectedAnswer) {
        event.preventDefault();
        if (awaitingReveal && onRevealAnswer) {
          onRevealAnswer();
        } else {
          onNext();
        }
        return;
      }

      if (key === "n" || key === "arrowright") {
        if (awaitingReveal) return;
        event.preventDefault();
        onNext();
        return;
      }

      if (key === "p" || key === "arrowleft") {
        event.preventDefault();
        onPrevious();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        onReview();
        return;
      }

      if (key === "f") {
        event.preventDefault();
        onToggleFlag();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    optionCount,
    hasSelectedAnswer,
    awaitingReveal,
    onSelectOption,
    onPrevious,
    onNext,
    onRevealAnswer,
    onReview,
    onToggleFlag,
  ]);
}
