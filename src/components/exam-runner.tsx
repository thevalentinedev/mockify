"use client";

import { ExamTimer } from "@/components/exam-timer";
import { BentoCard } from "@/components/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useIsClient } from "@/hooks/use-is-client";
import { SUBJECTS } from "@/lib/exam-config";
import {
  clearSession,
  loadProgress,
  loadSession,
  saveProgress,
  saveResult,
} from "@/lib/exam-session";
import type { ExamAnswer, ExamProgress, ExamResult, ExamSession } from "@/types/exam";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  Home,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ExamRunnerProps {
  session: ExamSession;
  initialProgress: ExamProgress | null;
}

function ExamRunnerInner({ session, initialProgress }: ExamRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(
    initialProgress?.currentIndex ?? 0
  );
  const [answers, setAnswers] = useState<ExamAnswer[]>(
    initialProgress?.answers ?? []
  );
  const [showReview, setShowReview] = useState(
    initialProgress?.showReview ?? false
  );
  const [submitted, setSubmitted] = useState(false);
  const resumed =
    (initialProgress?.answers.length ?? 0) > 0 ||
    (initialProgress?.currentIndex ?? 0) > 0;

  useEffect(() => {
    if (submitted) return;

    saveProgress(session, {
      currentIndex,
      answers,
      showReview,
    });
  }, [session, currentIndex, answers, showReview, submitted]);

  useEffect(() => {
    if (submitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted]);

  const finishExam = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    const result: ExamResult = {
      session,
      answers,
      completedAt: Date.now(),
    };

    saveResult(result);
    clearSession();
    router.push("/results");
  }, [session, answers, submitted, router]);

  const questions = session.questions;
  const current = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === current.id);
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter((a) => a.selectedIndex !== null).length;
  const subject = SUBJECTS.find((s) => s.id === current.subjectId);

  function selectAnswer(index: number) {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === current.id);
      if (existing) {
        return prev.map((a) =>
          a.questionId === current.id ? { ...a, selectedIndex: index } : a
        );
      }
      return [...prev, { questionId: current.id, selectedIndex: index }];
    });
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setShowReview(false);
  }

  if (showReview) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {resumed && (
          <p className="text-center text-sm text-muted-foreground">
            Progress restored — your answers were saved locally.
          </p>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Review answers</h2>
          <Badge variant="outline">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-5">
          {questions.map((q, i) => {
            const ans = answers.find((a) => a.questionId === q.id);
            const isAnswered =
              ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(i)}
                className={`rounded-xl border p-3 text-center text-sm font-medium transition-all hover:shadow-sm ${
                  isAnswered
                    ? "border-primary/30 bg-primary/5"
                    : "border-dashed border-muted-foreground/30 bg-muted/20"
                }`}
              >
                Q{i + 1}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowReview(false)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to exam
          </Button>
          <Button onClick={finishExam} className="gap-2 flex-1">
            <CheckCircle2 className="size-4" />
            Submit exam
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {resumed && (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
          Welcome back — your progress was saved.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {session.mode}
          </Badge>
          {subject && <Badge variant="secondary">{subject.name}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {session.timeLimitMinutes && (
            <ExamTimer
              startedAt={session.startedAt}
              timeLimitMinutes={session.timeLimitMinutes}
              onTimeUp={finishExam}
            />
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <BentoCard className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <span className="exam-label">Question {currentIndex + 1}</span>
          <h2 className="exam-question">{current.text}</h2>
        </div>

        <RadioGroup
          value={currentAnswer?.selectedIndex?.toString() ?? ""}
          onValueChange={(val) => selectAnswer(parseInt(val, 10))}
          className="space-y-3"
        >
          {current.options.map((option, index) => (
            <div key={index}>
              <Label
                htmlFor={`option-${index}`}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 sm:p-5 transition-all hover:bg-muted/50 ${
                  currentAnswer?.selectedIndex === index
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="exam-option">{option}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </BentoCard>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowReview(true)}
          className="gap-2"
        >
          <Flag className="size-4" />
          Review
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)} className="gap-2">
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={() => setShowReview(true)} className="gap-2">
            Finish
            <CheckCircle2 className="size-4" />
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/")}
        className="mx-auto flex gap-2 text-muted-foreground"
      >
        <Home className="size-4" />
        Exit to home
      </Button>
    </div>
  );
}

export function ExamRunner() {
  const router = useRouter();
  const isClient = useIsClient();
  const boot = useMemo(() => {
    if (!isClient) return { kind: "loading" as const };
    const session = loadSession();
    if (!session) return { kind: "redirect" as const };
    return {
      kind: "ready" as const,
      session,
      progress: loadProgress(session),
    };
  }, [isClient]);

  useEffect(() => {
    if (boot.kind === "redirect") router.replace("/");
  }, [boot, router]);

  if (boot.kind !== "ready") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ExamRunnerInner
      key={boot.session.startedAt}
      session={boot.session}
      initialProgress={boot.progress}
    />
  );
}
