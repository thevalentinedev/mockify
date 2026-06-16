"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export interface SetupFooterProps {
  showBack?: boolean;
  showContinue?: boolean;
  backLabel?: string;
  continueLabel?: string;
  backDisabled?: boolean;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  className?: string;
}

export function SetupFooter({
  showBack = true,
  showContinue = true,
  backLabel = "Back",
  continueLabel = "Continue",
  backDisabled = false,
  continueDisabled = false,
  continueLoading = false,
  onBack,
  onContinue,
  className,
}: SetupFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 soft-chrome pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex h-[var(--setup-footer-height)] max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        {showBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={backDisabled || continueLoading}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        ) : (
          <div />
        )}

        {showContinue ? (
          <Button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || continueLoading}
            className="gap-2"
            size="lg"
          >
            {continueLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {continueLabel}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
