"use client";

import { ExamTimer } from "@/components/exam-timer";
import { BentoCard } from "@/components/bento-card";
import { SubjectPills } from "@/components/subject-pills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionContextCard } from "@/components/question-context-card";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useExamKeyboard } from "@/hooks/use-exam-keyboard";
import { FormatMathText } from "@/lib/format-math-text";
import { recordExamResult } from "@/lib/learning-history";
import { useIsClient } from "@/hooks/use-is-client";
import { SUBJECTS } from "@/lib/exam-config";
import {
  getCurrentSection,
  normalizeProgress,
  normalizeSession,
} from "@/lib/exam-sections";
import {
  clearSession,
  loadProgress,
  loadSession,
  formatLastSaved,
  saveProgress,
  saveResult,
  saveSession,
} from "@/lib/exam-session";
import type {
  ExamAnswer,
  ExamProgress,
  ExamResult,
  ExamSession,
  QuestionTimeStat,
  SubjectId,
} from "@/types/exam";
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

function addQuestionTime(
  progress: ExamProgress,
  questionId: string,
  now = Date.now()
): Record<string, number> {
  if (!progress.questionOpenedAt) return progress.questionTimeMs;
  const elapsed = now - progress.questionOpenedAt;
  return {
    ...progress.questionTimeMs,
    [questionId]: (progress.questionTimeMs[questionId] ?? 0) + elapsed,
  };
}

function navigationProgressPatch(
  progress: ExamProgress,
  index: number,
  questionId: string | undefined,
  now = Date.now()
): Partial<ExamProgress> {
  return {
    currentIndex: index,
    showReview: false,
    questionTimeMs: questionId
      ? addQuestionTime(progress, questionId, now)
      : progress.questionTimeMs,
    questionOpenedAt: now,
  };
}

function ExamRunnerInner({ session: rawSession, initialProgress }: ExamRunnerProps) {
  const router = useRouter();
  const [session, setSession] = useState(() => normalizeSession(rawSession));
  const [progress, setProgress] = useState<ExamProgress>(() =>
    normalizeProgress(normalizeSession(rawSession), initialProgress ?? {
      startedAt: rawSession.startedAt,
      currentSubjectIndex: 0,
      currentIndex: 0,
      answers: [],
      showReview: false,
      completedSubjects: [],
      flaggedQuestionIds: [],
      questionTimeMs: {},
      questionOpenedAt: Date.now(),
      updatedAt: Date.now(),
    })
  );

  const [openContexts, setOpenContexts] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const subjectIndex = progress.currentSubjectIndex;
  const section = getCurrentSection(session, subjectIndex);
  const questions = section?.questions ?? [];
  const currentIndex = progress.currentIndex;
  const current = questions[currentIndex];
  const answers = progress.answers;
  const showReview = progress.showReview;

  const resumed =
    answers.length > 0 || currentIndex > 0 || progress.completedSubjects.length > 0;

  const persistProgress = useCallback(
    (patch: Partial<ExamProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...patch, updatedAt: Date.now() };
        saveProgress(session, {
          currentSubjectIndex: next.currentSubjectIndex,
          currentIndex: next.currentIndex,
          answers: next.answers,
          showReview: next.showReview,
          completedSubjects: next.completedSubjects,
          flaggedQuestionIds: next.flaggedQuestionIds,
          questionTimeMs: next.questionTimeMs,
          questionOpenedAt: next.questionOpenedAt,
        });
        return next;
      });
    },
    [session]
  );

  useEffect(() => {
    if (submitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted]);

  const finishEntireExam = useCallback(
    (finalSession: ExamSession, finalAnswers: ExamAnswer[]) => {
      if (submitted) return;
      setSubmitted(true);

      const timeStats: QuestionTimeStat[] = [];
      for (const sec of finalSession.sections) {
        sec.questions.forEach((q, index) => {
          const ms = progress.questionTimeMs[q.id];
          if (ms) {
            timeStats.push({
              questionId: q.id,
              subjectId: q.subjectId,
              index,
              timeMs: ms,
            });
          }
        });
      }

      const result: ExamResult = {
        session: finalSession,
        answers: finalAnswers,
        completedAt: Date.now(),
        timeStats,
      };

      recordExamResult(result);
      saveResult(result);
      clearSession();
      router.push("/results");
    },
    [submitted, router, progress.questionTimeMs]
  );

  const submitCurrentSubject = useCallback(() => {
    const activeSection = getCurrentSection(session, subjectIndex);
    if (!activeSection || submitted) return;

    const now = Date.now();
    const updatedSections = session.sections.map((s, i) =>
      i === subjectIndex ? { ...s, completedAt: now } : s
    );
    const completedSubjects = [
      ...progress.completedSubjects,
      activeSection.subjectId,
    ] as SubjectId[];

    const updatedSession: ExamSession = {
      ...session,
      sections: updatedSections,
    };
    setSession(updatedSession);
    saveSession(updatedSession);

    const isLastSubject = subjectIndex >= session.sections.length - 1;

    if (isLastSubject) {
      finishEntireExam(updatedSession, answers);
      return;
    }

    const nextIndex = subjectIndex + 1;
    const nextStartedAt = Date.now();
    const sectionsWithNextTimer = updatedSections.map((s, i) =>
      i === nextIndex ? { ...s, startedAt: nextStartedAt } : s
    );
    const sessionWithNext: ExamSession = {
      ...updatedSession,
      sections: sectionsWithNextTimer,
    };
    setSession(sessionWithNext);
    saveSession(sessionWithNext);

    setProgress((prev) => {
      const next: ExamProgress = {
        ...prev,
        currentSubjectIndex: nextIndex,
        currentIndex: 0,
        showReview: false,
        completedSubjects,
        updatedAt: Date.now(),
      };
      saveProgress(sessionWithNext, {
        currentSubjectIndex: next.currentSubjectIndex,
        currentIndex: next.currentIndex,
        answers: next.answers,
        showReview: next.showReview,
        completedSubjects: next.completedSubjects,
        flaggedQuestionIds: next.flaggedQuestionIds,
        questionTimeMs: next.questionTimeMs,
        questionOpenedAt: Date.now(),
      });
      return next;
    });
  }, [
    submitted,
    session,
    subjectIndex,
    progress.completedSubjects,
    answers,
    finishEntireExam,
  ]);

  const handleTimeUp = useCallback(() => {
    if (showReview) {
      submitCurrentSubject();
    } else {
      persistProgress({ showReview: true });
    }
  }, [showReview, submitCurrentSubject, persistProgress]);

  const currentAnswer = current
    ? answers.find((a) => a.questionId === current.id)
    : undefined;
  const progressPct = current
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;
  const answeredCount = questions.filter((q) =>
    answers.some((a) => a.questionId === q.id && a.selectedIndex !== null)
  ).length;
  const subject = section
    ? SUBJECTS.find((s) => s.id === section.subjectId)
    : undefined;
  const isLastSubject = subjectIndex >= session.sections.length - 1;
  const isFlagged = current
    ? progress.flaggedQuestionIds.includes(current.id)
    : false;

  function navigateToQuestion(index: number) {
    persistProgress(navigationProgressPatch(progress, index, current?.id));
  }

  function selectAnswer(index: number) {
    if (!current) return;
    persistProgress({
      answers: (() => {
        const existing = answers.find((a) => a.questionId === current.id);
        if (existing) {
          return answers.map((a) =>
            a.questionId === current.id ? { ...a, selectedIndex: index } : a
          );
        }
        return [...answers, { questionId: current.id, selectedIndex: index }];
      })(),
    });
  }

  useExamKeyboard({
    enabled: Boolean(current && !showReview && !submitted),
    optionCount: current?.options.length ?? 0,
    onSelectOption: selectAnswer,
    onPrevious: () => navigateToQuestion(Math.max(0, currentIndex - 1)),
    onNext: () =>
      navigateToQuestion(Math.min(questions.length - 1, currentIndex + 1)),
    onReview: () => persistProgress({ showReview: true }),
    onToggleFlag: () => {
      if (!current) return;
      const flagged = new Set(progress.flaggedQuestionIds);
      if (flagged.has(current.id)) flagged.delete(current.id);
      else flagged.add(current.id);
      persistProgress({ flaggedQuestionIds: [...flagged] });
    },
  });

  if (!section || !current) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function goToQuestion(index: number) {
    navigateToQuestion(index);
  }

  function toggleFlag() {
    const flagged = new Set(progress.flaggedQuestionIds);
    if (flagged.has(current.id)) flagged.delete(current.id);
    else flagged.add(current.id);
    persistProgress({ flaggedQuestionIds: [...flagged] });
  }

  if (showReview) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {resumed && (
          <p className="text-center text-sm text-muted-foreground">
            Progress restored — your answers were saved locally.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {session.mode}
            </Badge>
          </div>
          <SubjectPills
            subjects={session.subjects}
            activeSubjectId={section.subjectId}
            completedSubjects={progress.completedSubjects}
          />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Review {subject?.name ?? section.subjectId}
          </h2>
          <Badge variant="outline">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-5">
          {questions.map((q, i) => {
            const ans = answers.find((a) => a.questionId === q.id);
            const isAnswered =
              ans?.selectedIndex !== null && ans?.selectedIndex !== undefined;
            const flagged = progress.flaggedQuestionIds.includes(q.id);

            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(i)}
                className={`rounded-xl border p-3 text-center text-sm font-medium transition-all hover:shadow-sm ${
                  flagged
                    ? "border-amber-500/40 bg-amber-500/10"
                    : isAnswered
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
            onClick={() => persistProgress({ showReview: false })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to exam
          </Button>
          <Button onClick={submitCurrentSubject} className="gap-2 flex-1">
            <CheckCircle2 className="size-4" />
            {isLastSubject ? "Submit exam" : `Submit ${subject?.name} & continue`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        {resumed && (
          <p className="text-emerald-600 dark:text-emerald-400">
            Welcome back — progress restored.
          </p>
        )}
        <p className={resumed ? "" : "mx-auto"}>
          {formatLastSaved(progress.updatedAt)} · auto-saves locally
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {session.mode}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {section.timeLimitMinutes && section.startedAt > 0 && (
            <ExamTimer
              key={`${section.subjectId}-${section.startedAt}`}
              startedAt={section.startedAt}
              timeLimitMinutes={section.timeLimitMinutes}
              onTimeUp={handleTimeUp}
            />
          )}
          <span className="text-sm text-muted-foreground font-medium tabular-nums">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <SubjectPills
        subjects={session.subjects}
        activeSubjectId={section.subjectId}
        completedSubjects={progress.completedSubjects}
      />

      <Progress value={progressPct} className="h-1.5" />

      <BentoCard className="space-y-6 p-6 sm:p-8">
        {current.context && (
          <QuestionContextCard
            context={current.context}
            schoolId={session.schoolId}
            subjectId={section.subjectId}
            open={openContexts[current.contextKey ?? current.id] ?? false}
            onOpenChange={(open) =>
              setOpenContexts((prev) => ({
                ...prev,
                [current.contextKey ?? current.id]: open,
              }))
            }
          />
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="exam-label">Question {currentIndex + 1}</span>
            <ConfidenceBadge confidence={current.answerConfidence} />
          </div>
          <h2 className="exam-question">
            <FormatMathText>{current.text}</FormatMathText>
          </h2>
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
                <span className="exam-option">
                  <FormatMathText>{option}</FormatMathText>
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </BentoCard>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => navigateToQuestion(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>

        <Button
          variant={isFlagged ? "secondary" : "ghost"}
          onClick={toggleFlag}
          className="gap-2"
        >
          <Flag className="size-4" />
          {isFlagged ? "Flagged" : "Flag"}
        </Button>

        <Button
          variant="ghost"
          onClick={() => persistProgress({ showReview: true })}
          className="gap-2"
        >
          Review
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            onClick={() => navigateToQuestion(currentIndex + 1)}
            className="gap-2"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={() => persistProgress({ showReview: true })}
            className="gap-2"
          >
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
    const raw = loadSession();
    if (!raw) return { kind: "redirect" as const };
    const session = normalizeSession(raw);
    const progress = loadProgress(session);
    return {
      kind: "ready" as const,
      session,
      progress: progress ? normalizeProgress(session, progress) : null,
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
