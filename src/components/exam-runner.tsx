"use client";

import { ExamHeader } from "@/components/exam-header";
import { ExamNavBar } from "@/components/exam-nav-bar";
import {
  EXAM_NAV_MIN_QUESTIONS,
  ExamQuestionGrid,
  ExamQuestionNavRail,
  ExamQuestionNavSheet,
} from "@/components/exam-question-nav";
import { ExamReviewSummary } from "@/components/exam-review-summary";
import { ExamSubmitConfirmDialog } from "@/components/exam-submit-confirm";
import { ExamTimeNudge } from "@/components/exam-time-nudge";
import { ExamTimer } from "@/components/exam-timer";
import { KeyboardHints } from "@/components/keyboard-hints";
import { BentoCard } from "@/components/bento-card";
import { SubjectPills } from "@/components/subject-pills";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionContextCard } from "@/components/question-context-card";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { StudyAnswerPanel } from "@/components/study-answer-panel";
import { useExamKeyboard } from "@/hooks/use-exam-keyboard";
import { FormatMathText } from "@/lib/format-math-text";
import {
  hasAnsweredQuestion,
  isAnswerCorrect,
  isTextGradedQuestion,
} from "@/lib/answer-grader";
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { answerFeedback } from "@/lib/motivation";
import { softRow } from "@/lib/surface";

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
  const studyFeedbackRef = useRef<HTMLDivElement>(null);
  const pendingStudyScrollRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionNavOpen, setQuestionNavOpen] = useState(false);
  const [reviewUnlocked, setReviewUnlocked] = useState(
    () => initialProgress?.showReview ?? false
  );
  const [timeRunningLow, setTimeRunningLow] = useState(false);
  const [showTimeNudge, setShowTimeNudge] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const subjectIndex = progress.currentSubjectIndex;
  const section = getCurrentSection(session, subjectIndex);
  const questions = section?.questions ?? [];
  const currentIndex = progress.currentIndex;
  const current = questions[currentIndex];
  const answers = progress.answers;
  const showReview = progress.showReview;
  const studyMode = isStudyMode(session.mode);
  const revealedQuestionIds = progress.revealedQuestionIds ?? [];

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

  const enterReview = useCallback(() => {
    setReviewUnlocked(true);
    persistProgress({ showReview: true });
  }, [persistProgress]);

  const unansweredInSection = questions.filter((question) => {
    const answer = answers.find((a) => a.questionId === question.id);
    return !hasAnsweredQuestion(question, answer);
  }).length;

  const confirmSubmit = useCallback(
    (force = false) => {
      if (!force && unansweredInSection > 0) {
        setSubmitConfirmOpen(true);
        return;
      }
      setSubmitConfirmOpen(false);
      submitCurrentSubject();
    },
    [unansweredInSection, submitCurrentSubject]
  );

  const handleTimeUp = useCallback(() => {
    if (showReview) {
      submitCurrentSubject();
    } else {
      enterReview();
    }
  }, [showReview, submitCurrentSubject, enterReview]);

  const currentAnswer = current
    ? answers.find((a) => a.questionId === current.id)
    : undefined;
  const progressPct = current
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;
  const answeredCount = questions.filter((q) => {
    const answer = answers.find((a) => a.questionId === q.id);
    return hasAnsweredQuestion(q, answer);
  }).length;
  const subject = section
    ? SUBJECTS.find((s) => s.id === section.subjectId)
    : undefined;
  const isLastSubject = subjectIndex >= session.sections.length - 1;
  const isFlagged = current
    ? progress.flaggedQuestionIds.includes(current.id)
    : false;

  const isTextInput = current ? isTextGradedQuestion(current) : false;

  const hasSelectedAnswer = current
    ? hasAnsweredQuestion(current, currentAnswer)
    : false;

  const isAnswerRevealed =
    studyMode && current ? revealedQuestionIds.includes(current.id) : false;

  const awaitingReveal = studyMode && hasSelectedAnswer && !isAnswerRevealed;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentIndex, showReview, subjectIndex]);

  useEffect(() => {
    if (!studyMode || !isAnswerRevealed || !pendingStudyScrollRef.current) return;

    pendingStudyScrollRef.current = false;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scrollToFeedback = () => {
      studyFeedbackRef.current?.scrollIntoView({
        behavior: reduceMotion ? "instant" : "smooth",
        block: "start",
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToFeedback);
    });
  }, [studyMode, isAnswerRevealed, current?.id]);

  function navigateToQuestion(index: number) {
    persistProgress(navigationProgressPatch(progress, index, current?.id));
  }

  function handleRevealAnswer() {
    if (!current || !studyMode || isAnswerRevealed) return;
    if (!hasSelectedAnswer) return;
    const revealed = new Set(revealedQuestionIds);
    revealed.add(current.id);
    pendingStudyScrollRef.current = true;
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
      confirmSubmit();
    } else {
      enterReview();
    }
  }

  function handlePrevious() {
    navigateToQuestion(Math.max(0, currentIndex - 1));
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
        return [
          ...answers,
          { questionId: current.id, selectedIndex: index, textAnswer: null },
        ];
      })(),
    });
  }

  function setTextAnswer(value: string) {
    if (!current || (studyMode && isAnswerRevealed)) return;
    persistProgress({
      answers: (() => {
        const existing = answers.find((a) => a.questionId === current.id);
        if (existing) {
          return answers.map((a) =>
            a.questionId === current.id
              ? { ...a, textAnswer: value, selectedIndex: null }
              : a
          );
        }
        return [
          ...answers,
          { questionId: current.id, selectedIndex: null, textAnswer: value },
        ];
      })(),
    });
  }

  useExamKeyboard({
    enabled: Boolean(current && !showReview && !submitted),
    optionCount: isTextInput ? 0 : (current?.options?.length ?? 0),
    hasSelectedAnswer,
    awaitingReveal,
    onSelectOption: selectAnswer,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onRevealAnswer: handleRevealAnswer,
    onReview: enterReview,
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
        onLowTimeChange={setTimeRunningLow}
        onFiveMinuteWarning={() => setShowTimeNudge(true)}
      />
    ) : undefined;

  function goToQuestion(index: number) {
    navigateToQuestion(index);
  }

  const contextOpen = current.context
    ? (openContexts[current.contextKey ?? current.id] ??
      (current.context.type === "passage" ||
        current.context.type === "comprehension"))
    : false;

  const questionCard = (
    <BentoCard static className="exam-density shadow-sm">
      {current.context && (
        <QuestionContextCard
          context={current.context}
          schoolId={session.schoolId}
          subjectId={section.subjectId}
          open={contextOpen}
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

      {isTextInput ? (
        <div className="space-y-2">
          <Label htmlFor="numeric-answer" className="exam-label">
            Your answer
          </Label>
          <Input
            id="numeric-answer"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={currentAnswer?.textAnswer ?? ""}
            onChange={(event) => setTextAnswer(event.target.value)}
            disabled={studyMode && isAnswerRevealed}
            className={cn(
              "exam-density-option text-base",
              studyMode &&
                isAnswerRevealed &&
                (isAnswerCorrect(current, currentAnswer)
                  ? answerFeedback.correctBorder
                  : answerFeedback.incorrectBorder)
            )}
            placeholder="Enter your answer"
          />
          {studyMode && isAnswerRevealed && (
            <p
              className={cn(
                "text-sm",
                isAnswerCorrect(current, currentAnswer)
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {isAnswerCorrect(current, currentAnswer)
                ? "Answer: "
                : "Here's the answer: "}
              <FormatMathText>{current.answer ?? ""}</FormatMathText>
            </p>
          )}
        </div>
      ) : (
        <RadioGroup
          value={currentAnswer?.selectedIndex?.toString() ?? ""}
          onValueChange={(val) => selectAnswer(parseInt(val, 10))}
          className="exam-density-options"
          disabled={studyMode && isAnswerRevealed}
        >
          {(current.options ?? []).map((option, index) => {
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
                    "exam-density-option flex items-center gap-3 motion-safe:transition-all",
                    !studyMode || !isAnswerRevealed
                      ? softRow(isSelected)
                      : isCorrectOpt
                        ? answerFeedback.correct
                        : isWrongSelected
                          ? answerFeedback.incorrect
                          : "soft-row text-muted-foreground",
                    studyMode && isAnswerRevealed && "cursor-default"
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
                    {isWrongSelected && " (your pick)"}
                  </span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {studyMode && isAnswerRevealed && (
        <div
          ref={studyFeedbackRef}
          className="scroll-mt-[calc(var(--shell-header-height)+0.75rem)]"
        >
          <StudyAnswerPanel
            question={current}
            answer={currentAnswer}
            className="mt-4"
          />
        </div>
      )}
    </BentoCard>
  );

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

  const submitConfirmDialog = (
    <ExamSubmitConfirmDialog
      open={submitConfirmOpen}
      unansweredCount={unansweredInSection}
      totalQuestions={questions.length}
      subjectName={subject?.name ?? section?.subjectId ?? "this subject"}
      isLastSubject={isLastSubject}
      onCancel={() => setSubmitConfirmOpen(false)}
      onConfirm={() => confirmSubmit(true)}
    />
  );

  if (showReview) {
    const reviewProgressPct =
      questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const flaggedInSection = progress.flaggedQuestionIds.filter((id) =>
      questionIds.includes(id)
    ).length;

    return (
      <>
        <div className="mx-auto w-full max-w-5xl exam-content-pad space-y-4">
          <ExamHeader
            mode={session.mode}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            progressPct={reviewProgressPct}
            headerLabel={`${answeredCount}/${questions.length} answered`}
            subjectPills={subjectPills}
            alignTimerWithNav={showQuestionNav}
          />

          <div className="lg:flex lg:items-start lg:gap-6">
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-4">
            <h2 className="text-xl font-semibold">
              Review {subject?.name ?? section.subjectId}
            </h2>

            <ExamReviewSummary
              answeredCount={answeredCount}
              totalQuestions={questions.length}
              flaggedCount={flaggedInSection}
            />

            <p className="text-sm text-muted-foreground">
              Tap a question to go back and answer or change your choice, then
              return here to submit.
            </p>

            {!showQuestionNav && (
              <ExamQuestionGrid {...questionNavProps} />
            )}
            {showQuestionNav && (
              <p className="text-sm text-muted-foreground lg:hidden">
                Tap Questions below to jump back into the exam.
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
        </div>

        <ExamNavBar
          variant="review"
          submitLabel={submitLabel}
          onBackToExam={() => persistProgress({ showReview: false })}
          onSubmit={confirmSubmit}
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
        {submitConfirmDialog}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "mx-auto w-full max-w-5xl exam-content-pad space-y-4 motion-safe:transition-colors",
          timeRunningLow && !showReview && "lg:px-1"
        )}
      >
        <ExamHeader
          mode={session.mode}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          progressPct={progressPct}
          timer={timerSlot}
          timeLow={timeRunningLow}
          subjectPills={subjectPills}
          alignTimerWithNav={showQuestionNav}
        />

        {showTimeNudge && timeRunningLow && (
          <div className="max-w-3xl">
            <ExamTimeNudge onDismiss={() => setShowTimeNudge(false)} />
          </div>
        )}

        <div className="lg:flex lg:items-start lg:gap-6">
          <div className="mx-auto w-full max-w-3xl flex-1 space-y-4">
          <KeyboardHints
            hints={
              studyMode && !isTextInput
                ? [
                    { keys: "1–4", label: "answer" },
                    { keys: "Enter", label: "see answer / next" },
                    { keys: "P", label: "prev" },
                    { keys: "F", label: "flag" },
                  ]
                : studyMode
                  ? [
                      { keys: "Enter", label: "see answer / next" },
                      { keys: "P", label: "prev" },
                      { keys: "F", label: "flag" },
                    ]
                  : undefined
            }
          />

          {questionCard}
          </div>

        {showQuestionNav && (
          <ExamQuestionNavRail
            {...questionNavProps}
            className="hidden w-44 shrink-0 lg:block"
          />
        )}
        </div>
      </div>

      <ExamNavBar
        canGoPrevious={currentIndex > 0}
        canGoNext={canProceedPrimary}
        isFlagged={isFlagged}
        nextLabel={primaryNavLabel}
        hideReview={studyMode}
        highlightReview={reviewUnlocked && !showReview}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFlag={toggleFlag}
        onReview={enterReview}
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
      {submitConfirmDialog}
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
