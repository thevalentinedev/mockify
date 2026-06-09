"use client";

import { BentoCard } from "@/components/bento-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SUBJECTS } from "@/lib/exam-config";
import { loadResult } from "@/lib/exam-session";
import type { ExamResult } from "@/types/exam";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Lightbulb,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { useIsClient } from "@/hooks/use-is-client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export function ExamResults() {
  const router = useRouter();
  const isClient = useIsClient();
  const result = useMemo(
    () => (isClient ? loadResult<ExamResult>() : null),
    [isClient]
  );

  useEffect(() => {
    if (isClient && !result) router.replace("/");
  }, [isClient, result, router]);

  const stats = useMemo(() => {
    if (!result) return null;

    const { session, answers } = result;
    let correct = 0;
    const bySubject: Record<string, { correct: number; total: number }> = {};

    for (const question of session.questions) {
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

    const total = session.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationMs = result.completedAt - session.startedAt;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);

    const weakTopics: Record<string, number> = {};
    for (const question of session.questions) {
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
    };
  }, [result]);

  if (!result || !stats) return null;

  const { session } = result;

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
          You scored {stats.correct} out of {stats.total} questions correctly
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="capitalize">
            {session.mode}
          </Badge>
          <Badge variant="secondary">
            {stats.durationMin}m {stats.durationSec}s
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
        </BentoCard>
      )}

      <BentoCard className="space-y-4">
        <h2 className="font-semibold">Score by subject</h2>
        <div className="space-y-4">
          {Object.entries(stats.bySubject).map(([subjectId, data]) => {
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
        <h2 className="font-semibold">Answer review</h2>
        <div className="space-y-4">
          {session.questions.map((question, index) => {
            const answer = result.answers.find((a) => a.questionId === question.id);
            const isCorrect = answer?.selectedIndex === question.correctIndex;
            const subject = SUBJECTS.find((s) => s.id === question.subjectId);

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
                      {subject && (
                        <Badge variant="outline" className="text-xs">
                          {subject.name}
                        </Badge>
                      )}
                      {question.topic && (
                        <Badge variant="outline" className="text-xs">
                          {question.topic}
                        </Badge>
                      )}
                    </div>
                    <p className="exam-question text-[1.05rem] sm:text-[1.1rem]">{question.text}</p>
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
                            {String.fromCharCode(65 + i)}. {opt}
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
                              {question.wrongAnswerHints[String(answer.selectedIndex)]}
                            </p>
                          )}
                        {question.explanation && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Correct answer: </span>
                            {question.explanation}
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
