"use client";

import { BentoCard } from "@/components/bento-card";
import { ExamPreparing } from "@/components/exam-preparing";
import { SetupFooter } from "@/components/setup-footer";
import { StepIndicator } from "@/components/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MODES,
  QUICK_QUESTION_COUNT,
  SCHOOLS,
  SUBJECTS,
  getModeStartLabel,
  type SetupStep,
} from "@/lib/exam-config";
import { cn } from "@/lib/utils";
import {
  clearExamInProgress,
  loadSession,
  startNewExam,
} from "@/lib/exam-session";
import { Input } from "@/components/ui/input";
import {
  getWrongQuestionIds,
  loadPracticeTopics,
  clearPracticeTopics,
} from "@/lib/learning-history";
import {
  getUserAttempts,
  incrementUserAttempts,
} from "@/lib/user-attempts";
import type {
  ExamMode,
  SchoolId,
  SubjectCustomOptions,
  SubjectId,
} from "@/types/exam";
import type { SubjectEnsureResult } from "@/lib/bank-manager";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  Dna,
  FlaskConical,
  GraduationCap,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/use-is-client";
import { useEffect, useMemo, useState } from "react";

interface SessionStats {
  totalQuestions: number;
  totalTimeMinutes: number;
  timed: boolean;
  bySubject: {
    subjectId: SubjectId;
    questionCount: number;
    requestedCount?: number;
    maxQuestions?: number;
    poolSize: number;
    timeLimitMinutes: number;
    ready: boolean;
    poolComplete: boolean;
  }[];
}

const SUBJECT_ICONS = {
  BookOpen,
  Calculator,
  Dna,
  FlaskConical,
} as const;

const STEPS = [
  { id: "school", label: "School" },
  { id: "subjects", label: "Subjects" },
  { id: "mode", label: "Mode" },
];

function getModeMetaLine(modeId: string, timed?: boolean): string {
  if (modeId === "study") {
    return `${QUICK_QUESTION_COUNT} questions · instant feedback`;
  }
  if (modeId === "custom") {
    return "Your question count & timer";
  }
  return timed ? "Timed · full exam spec" : "Untimed · full exam spec";
}

export function ExamSetup() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("school");
  const [schoolId, setSchoolId] = useState<SchoolId | null>("conestoga");
  const [subjects, setSubjects] = useState<SubjectId[]>([]);
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [customPerSubject, setCustomPerSubject] = useState<
    Partial<Record<SubjectId, SubjectCustomOptions>>
  >({});
  const [prepareAudit, setPrepareAudit] = useState<SubjectEnsureResult[] | null>(
    null
  );
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [starting, setStarting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepareJobId, setPrepareJobId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<boolean | null>(null);
  const isClient = useIsClient();
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const inProgressSession = useMemo(() => {
    void sessionRefreshKey;
    return isClient ? loadSession() : null;
  }, [isClient, sessionRefreshKey]);

  const canFetchStats = Boolean(schoolId && subjects.length > 0 && mode);
  const displayStats = canFetchStats ? stats : null;
  const customQuestionsValid =
    mode !== "custom" ||
    subjects.every((subjectId) => {
      const max =
        displayStats?.bySubject.find((s) => s.subjectId === subjectId)
          ?.maxQuestions ?? QUICK_QUESTION_COUNT;
      const count = customPerSubject[subjectId]?.questionCount ?? QUICK_QUESTION_COUNT;
      return count >= 1 && count <= max;
    });
  const canStart = (displayStats?.bySubject?.length ?? 0) > 0 && customQuestionsValid;
  const previewOpen = previewOverride ?? subjects.length <= 3;

  const focusTopics = useMemo(() => {
    if (!isClient) return [];
    return loadPracticeTopics();
  }, [isClient]);

  const previewPayload = useMemo(() => {
    if (!schoolId || !mode) return null;
    return {
      school: schoolId,
      subjects,
      mode,
      ...(mode === "custom" ? { customPerSubject } : {}),
      ...(focusTopics.length ? { focusTopics } : {}),
    };
  }, [schoolId, subjects, mode, customPerSubject, focusTopics]);

  useEffect(() => {
    if (!previewPayload) return;

    let cancelled = false;

    fetch("/api/exam/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previewPayload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [previewPayload]);

  function toggleSubject(id: SubjectId) {
    setSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function goNext() {
    if (step === "school" && schoolId) setStep("subjects");
    else if (step === "subjects" && subjects.length > 0) setStep("mode");
  }

  function goBack() {
    if (step === "subjects") setStep("school");
    else if (step === "mode") setStep("subjects");
  }

  async function startExam() {
    if (!schoolId || subjects.length === 0 || !mode || starting) return;
    const jobId = crypto.randomUUID();
    setStarting(true);
    setPrepareJobId(jobId);
    setPreparing(true);
    setStartError(null);

    try {
      const prepareRes = await fetch("/api/exam/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: schoolId,
          subjects,
          jobId,
          userAttempts: getUserAttempts(subjects),
        }),
      });

      let prepareData: {
        error?: string;
        jobId?: string;
        bankResults?: SubjectEnsureResult[];
      } = {};
      try {
        prepareData = await prepareRes.json();
      } catch {
        setStartError(
          prepareRes.status === 504
            ? "Preparation timed out — first-time subjects need Pro plan or pre-built banks in Neon."
            : `Server error (${prepareRes.status}). Check /api/health on your deployment.`
        );
        return;
      }

      if (!prepareRes.ok) {
        setStartError(prepareData.error ?? "Could not prepare exam. Try again.");
        return;
      }

      setPrepareAudit(prepareData.bankResults ?? null);

      const wrongQuestionIdsBySubject = Object.fromEntries(
        subjects.map((id) => [id, getWrongQuestionIds(id)])
      ) as Partial<Record<SubjectId, string[]>>;

      const buildRes = await fetch("/api/exam/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: schoolId,
          subjects,
          mode,
          ...(mode === "custom" ? { customPerSubject } : {}),
          ...(focusTopics.length ? { focusTopics } : {}),
          wrongQuestionIdsBySubject,
        }),
      });

      let buildData: { error?: string; session?: import("@/types/exam").ExamSession } =
        {};
      try {
        buildData = await buildRes.json();
      } catch {
        setStartError(`Could not start exam (server error ${buildRes.status}).`);
        return;
      }

      if (!buildRes.ok || !buildData.session) {
        setStartError(buildData.error ?? "Could not start exam. Try again.");
        return;
      }

      incrementUserAttempts(schoolId, subjects);
      clearPracticeTopics();
      startNewExam(buildData.session);
      router.push("/exam");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connection issue. Try again.";
      setStartError(
        message.includes("fetch")
          ? "Connection issue. Your progress is safe — try again."
          : message
      );
    } finally {
      setStarting(false);
      setPreparing(false);
      setPrepareJobId(null);
      setPrepareAudit(null);
    }
  }

  const isHome = step === "school";
  const showResumeBanner = Boolean(inProgressSession) && !resumeDismissed;

  function handleDiscardExam() {
    clearExamInProgress();
    setSessionRefreshKey((key) => key + 1);
  }

  return (
    <>
      {preparing && mode && prepareJobId && schoolId && (
        <ExamPreparing
          jobId={prepareJobId}
          schoolId={schoolId}
          subjects={subjects}
          mode={mode}
          prepareAudit={prepareAudit}
        />
      )}

      <div
        className={cn(
          "mx-auto w-full max-w-4xl space-y-6",
          !isHome && "setup-content-pad"
        )}
      >
        {startError && (
          <p className="text-center text-sm text-destructive">{startError}</p>
        )}

        {showResumeBanner && inProgressSession && (
          <BentoCard
            compact
            className="flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5 pl-4 pr-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Exam in progress</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {inProgressSession.mode} · {inProgressSession.subjects.join(", ")}
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/exam">Resume</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDiscardExam}
              aria-label="Discard exam"
              className="shrink-0"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setResumeDismissed(true)}
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground"
            >
              <X className="size-4" />
            </Button>
          </BentoCard>
        )}

        {isHome && (
          <div className="space-y-2 text-center sm:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <GraduationCap className="size-4" />
              Pre-Assessment Practice
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Mock Exam Prep
            </h1>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
              Select your school, subjects, and mode to begin practicing for your
              entrance assessment.
            </p>
          </div>
        )}

        {!isHome && (
          <div className="sticky top-14 z-20 -mx-4 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
            <StepIndicator steps={STEPS} currentStep={step} />
          </div>
        )}

      {step === "school" && (
        <section key="school" className="setup-step-enter space-y-4">
          <h2 className="text-lg font-semibold">Select your school</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SCHOOLS.map((school) => (
              <BentoCard
                key={school.id}
                selected={schoolId === school.id}
                disabled={!school.available}
                onClick={() => {
                  if (!school.available) return;
                  setSchoolId(school.id);
                  setStep("subjects");
                }}
                className="bg-gradient-to-br from-primary/5 to-transparent"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{school.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {school.description}
                    </p>
                  </div>
                  {school.available ? (
                    <Badge variant="secondary">Available</Badge>
                  ) : (
                    <Badge variant="outline">Coming soon</Badge>
                  )}
                </div>
              </BentoCard>
            ))}
            <BentoCard disabled className="border-dashed opacity-60">
              <div className="flex h-full flex-col items-center justify-center gap-2 py-4 text-center">
                <Sparkles className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  More schools coming soon
                </p>
              </div>
            </BentoCard>
          </div>
        </section>
      )}

      {step === "subjects" && (
        <section key="subjects" className="setup-step-enter space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Choose subjects</h2>
            <Badge variant="outline">
              {subjects.length} selected
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Select one or more subjects. Questions will be drawn from each
            subject&apos;s bank.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.map((subject) => {
              const Icon = SUBJECT_ICONS[subject.icon as keyof typeof SUBJECT_ICONS];
              const isSelected = subjects.includes(subject.id);

              return (
                <BentoCard
                  key={subject.id}
                  selected={isSelected}
                  onClick={() => toggleSubject(subject.id)}
                  className={`bg-gradient-to-br ${subject.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <Label className="font-semibold cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {subject.description}
                      </p>
                    </div>
                  </div>
                </BentoCard>
              );
            })}
          </div>
        </section>
      )}

      {step === "mode" && (
        <section key="mode" className="setup-step-enter space-y-4">
          <h2 className="text-lg font-semibold">Select exam mode</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {MODES.map((m) => {
              const ModeIcon =
                m.id === "study"
                  ? GraduationCap
                  : m.id === "custom"
                    ? SlidersHorizontal
                    : m.timeLimit
                      ? Timer
                      : Zap;

              return (
                <BentoCard
                  key={m.id}
                  selected={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className="bg-gradient-to-br from-background to-muted/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <ModeIcon className="size-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{m.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {getModeMetaLine(m.id, m.timeLimit)}
                    </p>
                  </div>
                </BentoCard>
              );
            })}
          </div>

          {mode === "custom" && (
            <BentoCard className="space-y-4 bg-muted/30">
              <div>
                <h3 className="font-semibold">Custom settings per subject</h3>
                <p className="text-sm text-muted-foreground">
                  Set time to 0 for no timer on that subject.
                </p>
              </div>
              <div className="space-y-3">
                {subjects.map((subjectId) => {
                  const subject = SUBJECTS.find((s) => s.id === subjectId);
                  const max =
                    displayStats?.bySubject.find((s) => s.subjectId === subjectId)
                      ?.maxQuestions ?? QUICK_QUESTION_COUNT;
                  const settings = customPerSubject[subjectId] ?? {
                    questionCount: QUICK_QUESTION_COUNT,
                    timeLimitMinutes: 0,
                  };

                  const fields = (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor={`${subjectId}-questions`}>Questions</Label>
                        <Input
                          id={`${subjectId}-questions`}
                          type="number"
                          min={1}
                          max={max}
                          value={settings.questionCount}
                          onChange={(e) =>
                            setCustomPerSubject((prev) => ({
                              ...prev,
                              [subjectId]: {
                                ...settings,
                                questionCount: Math.max(
                                  1,
                                  parseInt(e.target.value, 10) || 1
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`${subjectId}-time`}>Time (minutes)</Label>
                        <Input
                          id={`${subjectId}-time`}
                          type="number"
                          min={0}
                          value={settings.timeLimitMinutes}
                          onChange={(e) =>
                            setCustomPerSubject((prev) => ({
                              ...prev,
                              [subjectId]: {
                                ...settings,
                                timeLimitMinutes: Math.max(
                                  0,
                                  parseInt(e.target.value, 10) || 0
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                    </>
                  );

                  if (subjects.length >= 3) {
                    return (
                      <details
                        key={subjectId}
                        className="group rounded-xl border bg-background/50"
                        open
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between p-3 font-medium [&::-webkit-details-marker]:hidden">
                          {subject?.name}
                          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid gap-3 border-t p-3 sm:grid-cols-3">
                          {fields}
                        </div>
                      </details>
                    );
                  }

                  return (
                    <div
                      key={subjectId}
                      className="grid gap-3 rounded-xl border bg-background/50 p-3 sm:grid-cols-3"
                    >
                      <p className="font-medium sm:col-span-3">{subject?.name}</p>
                      {fields}
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {focusTopics.length > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Practicing weak topics: {focusTopics.join(", ")}
            </p>
          )}

          {displayStats && (
            <BentoCard className="bg-muted/30">
              <button
                type="button"
                onClick={() => setPreviewOverride(!previewOpen)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <h3 className="font-semibold">Session preview</h3>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    previewOpen && "rotate-180"
                  )}
                />
              </button>

              {previewOpen && (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-background/60 p-3 text-center">
                      <p className="text-2xl font-bold">{displayStats.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">Exam questions</p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-3 text-center">
                      <p className="text-2xl font-bold">{subjects.length}</p>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-3 text-center">
                      <p className="text-2xl font-bold">
                        {displayStats.timed ? displayStats.totalTimeMinutes : "∞"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {displayStats.timed ? "Minutes" : "No limit"}
                      </p>
                    </div>
                  </div>
                  {displayStats.bySubject.map((s) => {
                    const subject = SUBJECTS.find((sub) => sub.id === s.subjectId);
                    const timeLabel =
                      s.timeLimitMinutes > 0 ? `${s.timeLimitMinutes} min` : "no limit";
                    return (
                      <p key={s.subjectId} className="text-xs text-muted-foreground">
                        {subject?.name}: {s.questionCount} questions · {timeLabel}
                        {s.ready && ` · ${s.poolSize} ready in bank`}
                      </p>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Questions are prepared automatically when you start.
                  </p>
                </div>
              )}
            </BentoCard>
          )}
        </section>
      )}
      </div>

      {step !== "school" && (
        <SetupFooter
          onBack={goBack}
          onContinue={step === "subjects" ? goNext : startExam}
          continueLabel={
            step === "mode" && mode
              ? `Start ${getModeStartLabel(mode)}`
              : "Continue"
          }
          continueDisabled={
            step === "subjects"
              ? subjects.length === 0
              : !mode || !displayStats || !canStart
          }
          continueLoading={starting}
        />
      )}
    </>
  );
}
