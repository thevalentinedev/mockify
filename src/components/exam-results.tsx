"use client";

import { BentoCard } from "@/components/bento-card";
import { ResultQuestionRow } from "@/components/result-question-row";
import { ResultsFooter } from "@/components/results-footer";
import { SubjectPills } from "@/components/subject-pills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";
import { isAnswerCorrect } from "@/lib/answer-grader";
import { getLearningObjective } from "@/lib/learning-objective";
import { SUBJECTS } from "@/lib/exam-config";
import { getAllQuestions, normalizeSession } from "@/lib/exam-sections";
import { savePracticeTopics } from "@/lib/learning-history";
import { loadResult } from "@/lib/exam-session";
import { cn } from "@/lib/utils";
import { divider, surface } from "@/lib/surface";
import type { ExamResult, SubjectId } from "@/types/exam";
import { RotateCcw, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function scoreRingClass(percentage: number): string {
  if (percentage >= 70) return "bg-emerald-500/10 text-emerald-600";
  if (percentage >= 50) return "bg-amber-500/10 text-amber-600";
  return "bg-red-500/10 text-red-600";
}

export function ExamResults() {
  const router = useRouter();
  const isClient = useIsClient();
  const reviewRef = useRef<HTMLElement>(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    () => new Set()
  );

  const result = useMemo(
    () => (isClient ? loadResult<ExamResult>() : null),
    [isClient]
  );

  const session = useMemo(
    () => (result ? normalizeSession(result.session) : null),
    [result]
  );

  const [activeSubjectId, setActiveSubjectId] = useState<SubjectId | null>(null);
  const resolvedSubjectId = activeSubjectId ?? session?.subjects[0] ?? null;

  useEffect(() => {
    if (isClient && !result) router.replace("/");
  }, [isClient, result, router]);

  const stats = useMemo(() => {
    if (!result || !session) return null;

    const allQuestions = getAllQuestions(session);
    const { answers } = result;
    let correct = 0;
    const bySubject: Record<string, { correct: number; total: number }> = {};

    for (const question of allQuestions) {
      const answer = answers.find((a) => a.questionId === question.id);
      const isCorrect = isAnswerCorrect(question, answer);

      if (!bySubject[question.subjectId]) {
        bySubject[question.subjectId] = { correct: 0, total: 0 };
      }
      bySubject[question.subjectId].total++;
      if (isCorrect) {
        correct++;
        bySubject[question.subjectId].correct++;
      }
    }

    const total = allQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationMs = result.completedAt - session.startedAt;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    const weakTopics: Record<string, number> = {};
    const weakLearningObjectives: Record<string, number> = {};
    for (const question of allQuestions) {
      const answer = answers.find((a) => a.questionId === question.id);
      const isCorrect = isAnswerCorrect(question, answer);
      if (isCorrect) continue;

      if (question.topic) {
        weakTopics[question.topic] = (weakTopics[question.topic] ?? 0) + 1;
      }

      const objective = getLearningObjective(question);
      if (objective) {
        weakLearningObjectives[objective] =
          (weakLearningObjectives[objective] ?? 0) + 1;
      }
    }

    const focusObjectives = Object.entries(weakLearningObjectives)
      .sort((a, b) => b[1] - a[1])
      .map(([objective]) => objective);

    const focusTopics = Object.entries(weakTopics)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);

    const practiceFocus = focusObjectives.length > 0 ? focusObjectives : focusTopics;

    return {
      correct,
      total,
      percentage,
      bySubject,
      durationMin,
      durationSec,
      focusTopics,
      focusObjectives,
      practiceFocus,
      allQuestions,
    };
  }, [result, session]);

  const activeQuestions = useMemo(() => {
    if (!stats || !resolvedSubjectId) return [];
    return stats.allQuestions.filter((q) => q.subjectId === resolvedSubjectId);
  }, [stats, resolvedSubjectId]);

  const timeSummary = useMemo(() => {
    if (!result?.timeStats?.length) return null;
    const times = result.timeStats.map((t) => t.timeMs);
    const slowest = Math.round(Math.max(...times) / 1000);
    const average = Math.round(
      times.reduce((sum, ms) => sum + ms, 0) / times.length / 1000
    );
    const sorted = result.timeStats.slice().sort((a, b) => b.timeMs - a.timeMs);
    return { slowest, average, sorted };
  }, [result]);

  function goHome() {
    router.push("/");
  }

  function goRetake() {
    router.push("/");
  }

  function practiceWeakTopics() {
    if (!stats?.practiceFocus.length) return;
    savePracticeTopics(stats.practiceFocus);
    router.push("/");
  }

  function handleSubjectSelect(subjectId: SubjectId) {
    setActiveSubjectId(subjectId);
    setExpandedQuestionIds(new Set());
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleQuestionExpanded(questionId: string) {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function expandAllQuestions() {
    setExpandedQuestionIds(new Set(activeQuestions.map((q) => q.id)));
  }

  function collapseAllQuestions() {
    setExpandedQuestionIds(new Set());
  }

  if (!result || !stats || !session || !resolvedSubjectId) return null;

  const activeSubjectStats = stats.bySubject[resolvedSubjectId];
  const activePct =
    activeSubjectStats && activeSubjectStats.total > 0
      ? Math.round((activeSubjectStats.correct / activeSubjectStats.total) * 100)
      : 0;
  const hasPracticeFocus = stats.practiceFocus.length > 0;
  const usingObjectives = stats.focusObjectives.length > 0;

  return (
    <>
      <div className="mx-auto w-full max-w-3xl setup-content-pad space-y-6">
        <section className="max-h-[40vh] space-y-3 text-center sm:space-y-4">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full sm:size-20",
              scoreRingClass(stats.percentage)
            )}
          >
            <span className="text-2xl font-bold sm:text-3xl">{stats.percentage}%</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold sm:text-2xl">Exam Complete</h1>
            <p className="text-sm text-muted-foreground">
              {stats.correct} / {stats.total} correct · {stats.durationMin}m{" "}
              {stats.durationSec}s
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="capitalize">
              {session.mode}
            </Badge>
            {session.subjects.map((subjectId) => {
              const data = stats.bySubject[subjectId];
              if (!data) return null;
              const subject = SUBJECTS.find((s) => s.id === subjectId);
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <Badge key={subjectId} variant="secondary" className="text-xs">
                  {subject?.name ?? subjectId}: {data.correct}/{data.total} ({pct}
                  %)
                </Badge>
              );
            })}
          </div>

          {hasPracticeFocus ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {usingObjectives ? "Skills to practice" : "Topics to practice"}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {stats.practiceFocus.slice(0, 4).map((item) => (
                  <Badge key={item} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {stats.practiceFocus.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{stats.practiceFocus.length - 4} more
                  </Badge>
                )}
              </div>
              <Button onClick={practiceWeakTopics} className="gap-2" size="lg">
                <Target className="size-4" />
                {usingObjectives ? "Practice weak skills" : "Practice weak topics"}
              </Button>
            </div>
          ) : (
            <Button onClick={goRetake} className="gap-2" size="lg">
              <RotateCcw className="size-4" />
              Retake exam
            </Button>
          )}
        </section>

        {timeSummary && (
          <details className={cn(surface, "group p-2")}>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-[var(--radius-surface)] p-2 font-medium [&::-webkit-details-marker]:hidden">
              <span>Timing details</span>
              <span className="text-sm font-normal text-muted-foreground">
                Slowest {timeSummary.slowest}s · Avg {timeSummary.average}s
              </span>
            </summary>
            <div className="space-y-3 p-2 pt-1">
              <div className={divider} />
              <div className="flex flex-wrap gap-2">
                {timeSummary.sorted.map((t) => (
                  <Badge key={t.questionId} variant="outline" className="text-xs">
                    Q{t.index + 1}: {Math.round(t.timeMs / 1000)}s
                  </Badge>
                ))}
              </div>
            </div>
          </details>
        )}

        <section ref={reviewRef} className="scroll-mt-36 space-y-4">
          <BentoCard static compact className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Answer review</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {SUBJECTS.find((s) => s.id === resolvedSubjectId)?.name}:{" "}
                  {activeSubjectStats?.correct}/{activeSubjectStats?.total} ({activePct}
                  %) · Tap a question to expand
                </p>
              </div>
              {activeQuestions.length > 0 && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={expandAllQuestions}
                  >
                    Expand all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={collapseAllQuestions}
                    disabled={expandedQuestionIds.size === 0}
                  >
                    Collapse
                  </Button>
                </div>
              )}
            </div>

            {session.subjects.length > 1 && (
              <SubjectPills
                subjects={session.subjects}
                activeSubjectId={resolvedSubjectId}
                completedSubjects={session.subjects}
                onSelect={handleSubjectSelect}
                interactive
              />
            )}

            <div className="space-y-2">
              {activeQuestions.map((question, index) => {
                const answer = result.answers.find(
                  (a) => a.questionId === question.id
                );
                return (
                  <ResultQuestionRow
                    key={question.id}
                    index={index}
                    question={question}
                    answer={answer}
                    expanded={expandedQuestionIds.has(question.id)}
                    onToggle={() => toggleQuestionExpanded(question.id)}
                  />
                );
              })}
            </div>
          </BentoCard>
        </section>
      </div>

      <ResultsFooter
        hasFocusTopics={hasPracticeFocus}
        onHome={goHome}
        onRetake={goRetake}
        onPracticeWeak={practiceWeakTopics}
      />
    </>
  );
}
