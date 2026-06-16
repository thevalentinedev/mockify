"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, RotateCcw, Target } from "lucide-react";

export interface ResultsFooterProps {
  hasFocusTopics?: boolean;
  onHome: () => void;
  onRetake: () => void;
  onPracticeWeak?: () => void;
  className?: string;
}

export function ResultsFooter({
  hasFocusTopics = false,
  onHome,
  onRetake,
  onPracticeWeak,
  className,
}: ResultsFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 soft-chrome soft-glass-bottom pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex h-[var(--setup-footer-height)] max-w-3xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onHome}
          className="gap-2"
        >
          <Home className="size-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>

        <div className="flex items-center gap-2">
          {hasFocusTopics && onPracticeWeak && (
            <Button
              type="button"
              onClick={onPracticeWeak}
              className="gap-1.5"
              size="lg"
            >
              <Target className="size-4" />
              <span className="hidden sm:inline">Practice weak topics</span>
              <span className="sm:hidden">Practice</span>
            </Button>
          )}
          <Button
            type="button"
            variant={hasFocusTopics ? "outline" : "default"}
            onClick={onRetake}
            className="gap-1.5"
            size="lg"
          >
            <RotateCcw className="size-4" />
            Retake
          </Button>
        </div>
      </div>
    </div>
  );
}
