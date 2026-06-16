"use client";

import { useAnimatedCount } from "@/hooks/use-animated-count";
import { getExamSpec, SUBJECTS } from "@/lib/exam-config";
import { getReadyCount, type PrepareProgress } from "@/lib/prepare-progress";
import { glassScrim, shell, surface } from "@/lib/surface";
import { cn } from "@/lib/utils";
import type { SubjectEnsureResult } from "@/lib/bank-manager";
import type { ExamMode, SchoolId, SubjectId } from "@/types/exam";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TIPS = [
  "Read each question fully before looking at the options.",
  "In mock mode, keep an eye on the timer — don't rush the early questions.",
  "If you're stuck, mark it and come back via Review.",
  "Wrong answers show explanations after you finish — use them to learn.",
  "Retakes rotate questions — every 3rd attempt adds new ones, every 5th twists familiar topics.",
  "Practice mode has no timer — great for learning new topics first.",
];

interface ExamPreparingProps {
  jobId: string;
  schoolId: SchoolId;
  subjects: SubjectId[];
  mode: ExamMode;
  prepareAudit?: SubjectEnsureResult[] | null;
}

export function ExamPreparing({
  jobId,
  schoolId,
  subjects,
  mode,
  prepareAudit,
}: ExamPreparingProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState<PrepareProgress | null>(null);

  const subjectNames = subjects
    .map((id) => SUBJECTS.find((s) => s.id === id)?.name ?? id)
    .join(", ");

  const totals = useMemo(() => {
    if (!progress?.subjects.length) return null;
    const ready = progress.subjects.reduce((sum, s) => sum + getReadyCount(s), 0);
    const target = progress.subjects.reduce((sum, s) => sum + s.target, 0);
    const message = progress.subjects.map((s) => s.message).find(Boolean);
    return { ready, target, message };
  }, [progress]);

  const singleSubject = progress?.subjects.length === 1 ? progress.subjects[0] : null;

  const rawReady = singleSubject
    ? getReadyCount(singleSubject)
    : (totals?.ready ?? 0);
  const fallbackTarget = useMemo(
    () =>
      subjects.reduce(
        (sum, subjectId) => sum + (getExamSpec(schoolId, subjectId)?.questionCount ?? 0),
        0
      ),
    [schoolId, subjects]
  );

  const rawTarget = singleSubject?.target ?? totals?.target ?? fallbackTarget;

  const animatedReady = useAnimatedCount(rawReady, 1);
  const statusMessage =
    singleSubject?.message ?? totals?.message ?? "Preparing your questions…";

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/exam/prepare-progress?jobId=${encodeURIComponent(jobId)}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as PrepareProgress;
        if (!cancelled) setProgress(data);
      } catch {
        // keep last known progress
      }
    }

    poll();
    const pollTimer = setInterval(poll, 400);
    return () => {
      cancelled = true;
      clearInterval(pollTimer);
    };
  }, [jobId]);

  return (
    <div
      className={cn("fixed inset-0 z-[100] flex items-center justify-center", glassScrim)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preparing-title"
    >
      <div className={cn(shell, "mx-auto w-full max-w-md space-y-6 p-6 sm:space-y-8 sm:p-8")}>
        <div className="text-center space-y-4">
          <div className={cn(surface, "inline-flex size-14 items-center justify-center sm:size-16")}>
            <Sparkles className="size-7 text-primary animate-pulse sm:size-8" />
          </div>

          <div className="space-y-1">
            <h2 id="preparing-title" className="text-xl font-semibold">
              Preparing your exam
            </h2>
            <p className="text-sm text-muted-foreground capitalize">
              {mode} · {subjectNames}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{statusMessage}</span>
          </div>
          {rawTarget > 0 && (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {animatedReady}/{rawTarget}
            </p>
          )}
          {subjects.length > 1 && progress?.subjects && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {progress.subjects.map((s) => {
                const name =
                  SUBJECTS.find((sub) => sub.id === s.subjectId)?.name ?? s.subjectId;
                return (
                  <p key={s.subjectId}>
                    {name}: {getReadyCount(s)}/{s.target}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className={cn(surface, "flex min-h-[4.5rem] items-center p-4")}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Tip: </span>
            {TIPS[tipIndex]}
          </p>
        </div>

        {prepareAudit && prepareAudit.length > 0 && (
          <div className={cn(surface, "space-y-1 p-3 text-left text-xs text-muted-foreground")}>
            <p className="font-medium text-foreground">Pool updates</p>
            {prepareAudit.flatMap((entry) =>
              entry.actions.map((action, i) => (
                <p key={`${entry.subjectId}-${i}`}>
                  {SUBJECTS.find((s) => s.id === entry.subjectId)?.name ?? entry.subjectId}:{" "}
                  {action}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
