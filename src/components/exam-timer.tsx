"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const EXAM_LOW_TIME_SECONDS = 5 * 60;

interface ExamTimerProps {
  startedAt: number;
  timeLimitMinutes: number;
  onTimeUp: () => void;
  onLowTimeChange?: (isLow: boolean) => void;
  onFiveMinuteWarning?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamTimer({
  startedAt,
  timeLimitMinutes,
  onTimeUp,
  onLowTimeChange,
  onFiveMinuteWarning,
}: ExamTimerProps) {
  const totalSeconds = timeLimitMinutes * 60;
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });
  const warnedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, totalSeconds, onTimeUp]);

  const isLow = remaining > 0 && remaining <= EXAM_LOW_TIME_SECONDS;

  useEffect(() => {
    onLowTimeChange?.(isLow);
  }, [isLow, onLowTimeChange]);

  useEffect(() => {
    if (!isLow || warnedRef.current) return;
    warnedRef.current = true;
    onFiveMinuteWarning?.();
  }, [isLow, onFiveMinuteWarning]);

  const timeLabel = formatTime(remaining);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLow ? `Warning: ${timeLabel} remaining` : `${timeLabel} remaining`}
      </div>
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 border-transparent px-3 py-1 font-mono text-sm tabular-nums",
          isLow
            ? "border-rose-500/30 bg-rose-500/15 text-rose-800 motion-safe:animate-pulse dark:text-rose-200"
            : "bg-secondary text-secondary-foreground"
        )}
        aria-label={`${timeLabel} remaining`}
      >
        <Clock className={cn("size-3.5", isLow && "text-rose-600 dark:text-rose-400")} />
        {timeLabel}
      </Badge>
    </>
  );
}
