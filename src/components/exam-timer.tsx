"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ExamTimerProps {
  startedAt: number;
  timeLimitMinutes: number;
  onTimeUp: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamTimer({ startedAt, timeLimitMinutes, onTimeUp }: ExamTimerProps) {
  const totalSeconds = timeLimitMinutes * 60;
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });

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

  const isLow = remaining <= 300;
  const timeLabel = formatTime(remaining);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLow ? `Warning: ${timeLabel} remaining` : `${timeLabel} remaining`}
      </div>
      <Badge
        variant={isLow ? "destructive" : "secondary"}
        className="gap-1.5 px-3 py-1 text-sm font-mono tabular-nums"
        aria-label={`${timeLabel} remaining`}
      >
        <Clock className="size-3.5" />
        {timeLabel}
      </Badge>
    </>
  );
}
