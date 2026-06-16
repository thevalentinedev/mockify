"use client";

import { ExamHeader } from "@/components/exam-header";
import { ExamNavBar } from "@/components/exam-nav-bar";
import {
  EXAM_NAV_MIN_QUESTIONS,
  ExamQuestionGrid,
  ExamQuestionNavRail,
  ExamQuestionNavSheet,
} from "@/components/exam-question-nav";
import { ExamTimer } from "@/components/exam-timer";
import { KeyboardHints } from "@/components/keyboard-hints";
import { BentoCard } from "@/components/bento-card";
import { SubjectPills } from "@/components/subject-pills";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionContextCard } from "@/components/question-context-card";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { StudyAnswerPanel } from "@/components/study-answer-panel";
import { useExamKeyboard } from "@/hooks/use-exam-keyboard";
import { FormatMathText } from "@/lib/format-math-text";
import { recordExamResult } from "@/lib/learning-history";
import { useIsClient } from "@/hooks/use-is-client";
import { isStudyMode, SUBJECTS } from "@/lib/exam-config";
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
import { Home, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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
      revealedQuestionIds: [],
      questionTimeMs: {},
      questionOpenedAt: Date.now(),
      updatedAt: Date.now(),
    })
  );

  const [openContexts, setOpenContexts] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [questionNavOpen, setQuestionNavOpen] = useState(false);

  const subjectIndex = progress.currentSubjectIndex;
  const section = getCurrentSection(session, subjectIndex);
  const questions = section?.questions ?? [];
  const currentIndex = progress.currentIndex;
  const current = questions[currentIndex];
  const answers = progress.answers;
  const showReview = progress.showReview;
  const studyMode = isStudyMode(session.mode);
  const revealedQuestionIds = progress.revealedQuestionIds ?? [];

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
          revealedQuestionIds: next.revealedQuestionIds,
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
        revealedQuestionIds: next.revealedQuestionIds,
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

  const hasSelectedAnswer =
    currentAnswer?.selectedIndex !== null &&
    currentAnswer?.selectedIndex !== undefined;

  const isAnswerRevealed =
    studyMode && current ? revealedQuestionIds.includes(current.id) : false;

  const awaitingReveal = studyMode && hasSelectedAnswer && !isAnswerRevealed;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentIndex, showReview, subjectIndex]);

  function navigateToQuestion(index: number) {
    persistProgress(navigationProgressPatch(progress, index, current?.id));
  }

  function handleRevealAnswer() {
    if (!current || !studyMode || isAnswerRevealed) return;
    if (!hasSelectedAnswer) return;
    const revealed = new Set(revealedQuestionIds);
    revealed.add(current.id);
    persistProgress({ revealedQuestionIds: [...revealed] });
  }

  function handleNext() {
    if (studyMode && awaitingReveal) {
      handleRevealAnswer();
      return;
    }

    if (currentIndex < questions.length - 1) {
      navigateToQuestion(currentIndex + 1);
    } else if (studyMode) {
      submitCurrentSubject();
    } else {
      persistProgress({ showReview: true });
    }
  }

  function handlePrevious() {
    navigateToQuestion(Math.max(0, currentIndex - 1));
  }

  function openReview() {
    persistProgress({ showReview: true });
  }

  function toggleFlag() {
    if (!current) return;
    const flagged = new Set(progress.flaggedQuestionIds);
    if (flagged.has(current.id)) flagged.delete(current.id);
    else flagged.add(current.id);
    persistProgress({ flaggedQuestionIds: [...flagged] });
  }

  function selectAnswer(index: number) {
    if (!current || (studyMode && isAnswerRevealed)) return;
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
    hasSelectedAnswer,
    awaitingReveal,
    onSelectOption: selectAnswer,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onRevealAnswer: handleRevealAnswer,
    onReview: openReview,
    onToggleFlag: toggleFlag,
  });

  if (!section || !current) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subjectPills =
    session.subjects.length > 1 ? (
      <SubjectPills
        subjects={session.subjects}
        activeSubjectId={section.subjectId}
        completedSubjects={progress.completedSubjects}
      />
    ) : undefined;

  const timerSlot =
    section.timeLimitMinutes && section.startedAt > 0 ? (
      <ExamTimer
        key={`${section.subjectId}-${section.startedAt}`}
        startedAt={section.startedAt}
        timeLimitMinutes={section.timeLimitMinutes}
        onTimeUp={handleTimeUp}
      />
    ) : undefined;

  const exitAction = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => {
        if (
          window.confirm(
            "Exit exam? Your progress is saved locally — you can resume from the home page."
          )
        ) {
          router.push("/");
        }
      }}
      aria-label="Exit exam"
      className="shrink-0 text-muted-foreground"
    >
      <Home className="size-4" />
    </Button>
  );

  const autosaveLabel = resumed
    ? "Restored · saved locally"
    : `${formatLastSaved(progress.updatedAt)} · saved`;

  function goToQuestion(index: number) {
    navigateToQuestion(index);
  }

  const primaryNavLabel = studyMode
    ? isAnswerRevealed
      ? currentIndex < questions.length - 1
        ? "Next"
        : isLastSubject
          ? "Finish"
          : `Next: ${SUBJECTS.find((s) => s.id === session.sections[subjectIndex + 1]?.subjectId)?.name ?? "subject"}`
      : "See answer"
    : currentIndex < questions.length - 1
      ? "Next"
      : "Finish";

  const canProceedPrimary = studyMode
    ? isAnswerRevealed || hasSelectedAnswer
    : true;

  const submitLabel = isLastSubject
    ? "Submit exam"
    : `Submit ${subject?.name ?? section.subjectId}`;

  const questionIds = questions.map((q) => q.id);
  const showQuestionNav = questions.length >= EXAM_NAV_MIN_QUESTIONS;

  const questionNavProps = {
    questionCount: questions.length,
    currentIndex,
    answers,
    questionIds,
    flaggedQuestionIds: progress.flaggedQuestionIds,
    onSelect: goToQuestion,
  };

  if (showReview) {
    const reviewProgressPct =
      questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
      <>
        <ExamHeader
          mode={session.mode}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          progressPct={reviewProgressPct}
          headerLabel={`${answeredCount}/${questions.length} answered`}
          autosaveLabel={autosaveLabel}
          resumed={resumed}
          subjectPills={subjectPills}
          actions={exitAction}
        />

        <div className="mx-auto w-full max-w-5xl lg:flex lg:items-start lg:gap-6">
          <div className="mx-auto w-full max-w-3xl flex-1 exam-content-pad space-y-4">
            <h2 className="text-xl font-semibold">
              Review {subject?.name ?? section.subjectId}
            </h2>

            {!showQuestionNav && (
              <ExamQuestionGrid {...questionNavProps} />
            )}
            {showQuestionNav && (
              <p className="text-sm text-muted-foreground lg:hidden">
                Tap Questions below to jump, or use the list on larger screens.
              </p>
            )}
          </div>

          {showQuestionNav && (
            <ExamQuestionNavRail
              {...questionNavProps}
              className="hidden w-44 shrink-0 lg:block"
            />
          )}
        </div>

        <ExamNavBar
          variant="review"
          submitLabel={submitLabel}
          onBackToExam={() => persistProgress({ showReview: false })}
          onSubmit={submitCurrentSubject}
          showQuestionsNav={showQuestionNav}
          onOpenQuestions={() => setQuestionNavOpen(true)}
        />

        {showQuestionNav && (
          <ExamQuestionNavSheet
            open={questionNavOpen}
            onOpenChange={setQuestionNavOpen}
            {...questionNavProps}
          />
        )}
      </>
    );
  }

  return (
    <>
      <ExamHeader
        mode={session.mode}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        progressPct={progressPct}
        autosaveLabel={autosaveLabel}
        resumed={resumed}
        timer={timerSlot}
        subjectPills={subjectPills}
        actions={exitAction}
      />

      <div className="mx-auto w-full max-w-5xl lg:flex lg:items-start lg:gap-6">
        <div className="mx-auto w-full max-w-3xl flex-1 exam-content-pad space-y-4">
          <KeyboardHints
            hints={
              studyMode
                ? [
                    { keys: "1–4", label: "answer" },
                    { keys: "Enter", label: "see answer / next" },
                    { keys: "P", label: "prev" },
                    { keys: "F", label: "flag" },
                  ]
                : undefined
            }
          />

          <BentoCard static className="exam-density shadow-sm">
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
            <h2 id="exam-question" className="exam-question">
              <FormatMathText>{current.text}</FormatMathText>
            </h2>
          </div>

          <RadioGroup
            value={currentAnswer?.selectedIndex?.toString() ?? ""}
            onValueChange={(val) => selectAnswer(parseInt(val, 10))}
            className="exam-density-options"
            disabled={studyMode && isAnswerRevealed}
          >
            {current.options.map((option, index) => {
              const isSelected = currentAnswer?.selectedIndex === index;
              const isCorrectOpt =
                studyMode && isAnswerRevealed && current.correctIndex === index;
              const isWrongSelected =
                studyMode && isAnswerRevealed && isSelected && !isCorrectOpt;

              return (
                <div key={index}>
                  <Label
                    htmlFor={`option-${index}`}
                    className={cn(
                      "exam-density-option flex items-center gap-3 rounded-xl border motion-safe:transition-all",
                      studyMode && isAnswerRevealed
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-muted/50",
                      !studyMode || !isAnswerRevealed
                        ? isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border"
                        : isCorrectOpt
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : isWrongSelected
                            ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
                            : "border-border text-muted-foreground"
                    )}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      disabled={studyMode && isAnswerRevealed}
                    />
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="exam-option">
                      <FormatMathText>{option}</FormatMathText>
                      {isCorrectOpt && " ✓"}
                      {isWrongSelected && " (your answer)"}
                    </span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {studyMode && isAnswerRevealed && (
            <StudyAnswerPanel
              question={current}
              answer={currentAnswer}
              className="mt-4"
            />
          )}
        </BentoCard>
        </div>

        {showQuestionNav && (
          <ExamQuestionNavRail
            {...questionNavProps}
            className="hidden w-44 shrink-0 lg:block"
          />
        )}
      </div>

      <ExamNavBar
        canGoPrevious={currentIndex > 0}
        canGoNext={canProceedPrimary}
        isFlagged={isFlagged}
        nextLabel={primaryNavLabel}
        hideReview={studyMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFlag={toggleFlag}
        onReview={openReview}
        showQuestionsNav={showQuestionNav}
        onOpenQuestions={() => setQuestionNavOpen(true)}
      />

      {showQuestionNav && (
        <ExamQuestionNavSheet
          open={questionNavOpen}
          onOpenChange={setQuestionNavOpen}
          {...questionNavProps}
        />
      )}
    </>
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
