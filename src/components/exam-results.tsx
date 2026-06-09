"use client";

import { BentoCard } from "@/components/bento-card";
import { SubjectPills } from "@/components/subject-pills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useIsClient } from "@/hooks/use-is-client";
import { SUBJECTS } from "@/lib/exam-config";
import { getAllQuestions, normalizeSession } from "@/lib/exam-sections";
import { FormatMathText } from "@/lib/format-math-text";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { savePracticeTopics } from "@/lib/learning-history";
import { loadResult } from "@/lib/exam-session";
import type { ExamResult, SubjectId } from "@/types/exam";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Lightbulb,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function ExamResults() {
  const router = useRouter();
  const isClient = useIsClient();
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
      const isCorrect = answer?.selectedIndex === question.correctIndex;

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
    for (const question of allQuestions) {
      const answer = answers.find((a) => a.questionId === question.id);
      const isCorrect = answer?.selectedIndex === question.correctIndex;
      if (!isCorrect && question.topic) {
        weakTopics[question.topic] = (weakTopics[question.topic] ?? 0) + 1;
      }
    }

    const focusTopics = Object.entries(weakTopics)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);

    return {
      correct,
      total,
      percentage,
      bySubject,
      durationMin,
      durationSec,
      focusTopics,
      allQuestions,
    };
  }, [result, session]);

  const activeQuestions = useMemo(() => {
    if (!stats || !resolvedSubjectId) return [];
    return stats.allQuestions.filter((q) => q.subjectId === resolvedSubjectId);
  }, [stats, resolvedSubjectId]);

  if (!result || !stats || !session || !resolvedSubjectId) return null;

  const activeSubjectStats = stats.bySubject[resolvedSubjectId];
  const activePct =
    activeSubjectStats && activeSubjectStats.total > 0
      ? Math.round((activeSubjectStats.correct / activeSubjectStats.total) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="text-center space-y-3">
        <div
          className={`mx-auto flex size-20 items-center justify-center rounded-full ${
            stats.percentage >= 70
              ? "bg-emerald-500/10 text-emerald-600"
              : stats.percentage >= 50
                ? "bg-amber-500/10 text-amber-600"
                : "bg-red-500/10 text-red-600"
          }`}
        >
          <span className="text-3xl font-bold">{stats.percentage}%</span>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Exam Complete</h1>
        <p className="text-muted-foreground">
          Overall: {stats.correct} / {stats.total} correct
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="capitalize">
            {session.mode}
          </Badge>
          <Badge variant="secondary">
            {stats.durationMin}m {stats.durationSec}s total
          </Badge>
        </div>
      </div>

      {stats.focusTopics.length > 0 && (
        <BentoCard className="space-y-3 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-amber-600" />
            <h2 className="font-semibold">Focus areas for next practice</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Topics you missed — retake practice targeting these to work toward 100%.
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.focusTopics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              savePracticeTopics(stats.focusTopics);
              router.push("/");
            }}
          >
            <Target className="size-4" />
            Practice weak topics
          </Button>
        </BentoCard>
      )}

      {result.timeStats && result.timeStats.length > 0 && (
        <BentoCard className="space-y-3">
          <h2 className="font-semibold">Time per question</h2>
          <p className="text-sm text-muted-foreground">
            Slowest:{" "}
            {Math.round(
              Math.max(...result.timeStats.map((t) => t.timeMs)) / 1000
            )}
            s · Average:{" "}
            {Math.round(
              result.timeStats.reduce((s, t) => s + t.timeMs, 0) /
                result.timeStats.length /
                1000
            )}
            s
          </p>
          <div className="flex flex-wrap gap-2">
            {result.timeStats
              .slice()
              .sort((a, b) => b.timeMs - a.timeMs)
              .slice(0, 8)
              .map((t) => (
                <Badge key={t.questionId} variant="outline" className="text-xs">
                  Q{t.index + 1}: {Math.round(t.timeMs / 1000)}s
                </Badge>
              ))}
          </div>
        </BentoCard>
      )}

      <BentoCard className="space-y-4">
        <h2 className="font-semibold">Score by subject</h2>
        <div className="space-y-4">
          {session.subjects.map((subjectId) => {
            const data = stats.bySubject[subjectId];
            if (!data) return null;
            const subject = SUBJECTS.find((s) => s.id === subjectId);
            const pct = Math.round((data.correct / data.total) * 100);

            return (
              <div key={subjectId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{subject?.name ?? subjectId}</span>
                  <span className="text-muted-foreground">
                    {data.correct}/{data.total} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </div>
      </BentoCard>

      <BentoCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Answer review</h2>
            {activeSubjectStats && (
              <p className="text-sm text-muted-foreground mt-1">
                {SUBJECTS.find((s) => s.id === resolvedSubjectId)?.name}:{" "}
                {activeSubjectStats.correct}/{activeSubjectStats.total} ({activePct}%)
              </p>
            )}
          </div>
        </div>

        <SubjectPills
          subjects={session.subjects}
          activeSubjectId={resolvedSubjectId}
          completedSubjects={session.subjects}
          onSelect={setActiveSubjectId}
          interactive
        />

        <div className="space-y-4">
          {activeQuestions.map((question, index) => {
            const answer = result.answers.find((a) => a.questionId === question.id);
            const isCorrect = answer?.selectedIndex === question.correctIndex;

            return (
              <div key={question.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-red-500 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{index + 1}
                      </span>
                      <ConfidenceBadge confidence={question.answerConfidence} />
                      {question.topic && (
                        <Badge variant="outline" className="text-xs">
                          {question.topic}
                        </Badge>
                      )}
                    </div>
                    <p className="exam-question text-[1.05rem] sm:text-[1.1rem]">
                      <FormatMathText>{question.text}</FormatMathText>
                    </p>
                    <div className="space-y-1.5">
                      {question.options.map((opt, i) => {
                        const isSelected = answer?.selectedIndex === i;
                        const isCorrectOpt = question.correctIndex === i;

                        return (
                          <p
                            key={i}
                            className={`exam-option rounded-lg px-3 py-2 ${
                              isCorrectOpt
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : isSelected
                                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}.{" "}
                            <FormatMathText>{opt}</FormatMathText>
                            {isCorrectOpt && " ✓"}
                            {isSelected && !isCorrectOpt && " (your answer)"}
                          </p>
                        );
                      })}
                    </div>
                    {(question.explanation ||
                      (answer?.selectedIndex != null &&
                        question.wrongAnswerHints?.[String(answer.selectedIndex)])) && (
                      <div
                        className={`rounded-xl p-4 space-y-2 text-sm ${
                          isCorrect
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-amber-500/5 border border-amber-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Lightbulb className="size-4" />
                          {isCorrect ? "Why this is correct" : "Learn from this"}
                        </div>
                        {!isCorrect &&
                          answer?.selectedIndex != null &&
                          question.wrongAnswerHints?.[String(answer.selectedIndex)] && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Your answer: </span>
                              <FormatMathText>
                                {question.wrongAnswerHints[String(answer.selectedIndex)]}
                              </FormatMathText>
                            </p>
                          )}
                        {question.explanation && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Correct answer: </span>
                            <FormatMathText>{question.explanation}</FormatMathText>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </BentoCard>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => router.push("/")} className="gap-2 flex-1" size="lg">
          <RotateCcw className="size-4" />
          Retake
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="gap-2"
          size="lg"
        >
          <Home className="size-4" />
          Home
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
