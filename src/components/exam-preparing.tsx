"use client";

import { SUBJECTS } from "@/lib/exam-config";
import type { SubjectId } from "@/types/exam";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const TIPS = [
  "Read each question fully before looking at the options.",
  "In mock mode, keep an eye on the timer — don't rush the early questions.",
  "If you're stuck, mark it and come back via Review.",
  "Wrong answers show explanations after you finish — use them to learn.",
  "Retakes shuffle questions and options — real mastery beats memorizing order.",
  "Practice mode has no timer — great for learning new topics first.",
];

interface ExamPreparingProps {
  subjects: SubjectId[];
  mode: string;
}

export function ExamPreparing({ subjects, mode }: ExamPreparingProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const subjectNames = subjects
    .map((id) => SUBJECTS.find((s) => s.id === id)?.name ?? id)
    .join(", ");

  const steps = [
    "Checking question bank",
    "Preparing your questions",
    "Building your exam",
    "Almost ready",
  ];

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 8000);
    return () => {
      clearInterval(tipTimer);
      clearInterval(stepTimer);
    };
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md space-y-8 px-6 text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10">
          <Sparkles className="size-8 text-primary animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Preparing your exam</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {mode} · {subjectNames}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>{steps[stepIndex]}…</span>
        </div>

        <div className="rounded-2xl border bg-card/80 p-5 text-left min-h-[5rem] flex items-center">
          <p className="text-sm text-muted-foreground leading-relaxed transition-opacity duration-500">
            <span className="font-medium text-foreground">Tip: </span>
            {TIPS[tipIndex]}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          First time for a subject takes longer. Later attempts are instant.
        </p>
      </div>
    </div>
  );
}
