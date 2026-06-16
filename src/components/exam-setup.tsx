"use client";

import { BentoCard } from "@/components/bento-card";
import { ExamPreparing } from "@/components/exam-preparing";
import { SetupFooter } from "@/components/setup-footer";
import { StepIndicator } from "@/components/step-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MODES,
  QUICK_QUESTION_COUNT,
  SCHOOLS,
  SUBJECTS,
  getModeStartLabel,
  type SetupStep,
} from "@/lib/exam-config";
import { MATHS_PROGRAMS } from "@/lib/maths-program";
import { formatTopicLabel } from "@/lib/question-topics";
import { iconTile, shell, softCheck, softRow, statTile, surface } from "@/lib/surface";
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
  MathsProgramId,
  SchoolId,
  SubjectCustomOptions,
  SubjectId,
} from "@/types/exam";
import type { SubjectEnsureResult } from "@/lib/bank-manager";
import {
  BookOpen,
  Calculator,
  Check,
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
    totalPoolSize?: number;
    topics?: { label: string; count: number }[];
    studyTopic?: string | null;
    studyTopics?: string[] | null;
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

function getModeIcon(modeId: ExamMode) {
  if (modeId === "study") return GraduationCap;
  if (modeId === "custom") return SlidersHorizontal;
  const config = MODES.find((m) => m.id === modeId);
  return config?.timeLimit ? Timer : Zap;
}

type ModeSubview = "pick" | "configure";

function formatStudyTopicSummary(
  selectedTopics: string[],
  totalPoolSize: number
): string {
  if (selectedTopics.length === 0) {
    return `All topics · ${totalPoolSize} ready`;
  }
  if (selectedTopics.length === 1) {
    return formatTopicLabel(selectedTopics[0]);
  }
  return `${selectedTopics.length} topics selected`;
}

export function ExamSetup() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("school");
  const [schoolId, setSchoolId] = useState<SchoolId | null>("conestoga");
  const [subjects, setSubjects] = useState<SubjectId[]>([]);
  const [mathsProgram, setMathsProgram] = useState<MathsProgramId | null>(null);
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [modeSubview, setModeSubview] = useState<ModeSubview>("pick");
  const [studyTopicsBySubject, setStudyTopicsBySubject] = useState<
    Partial<Record<SubjectId, string[]>>
  >({});
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
  const canStart =
    (displayStats?.bySubject?.length ?? 0) > 0 &&
    customQuestionsValid &&
    (mode !== "study" ||
      (displayStats?.bySubject.every((s) => s.questionCount > 0) ?? false));
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
      ...(mode === "study" &&
      Object.values(studyTopicsBySubject).some((topics) => topics?.length)
        ? { studyTopicsBySubject }
        : {}),
      ...(focusTopics.length ? { focusTopics } : {}),
      ...(subjects.includes("maths") && mathsProgram ? { mathsProgram } : {}),
    };
  }, [schoolId, subjects, mode, customPerSubject, focusTopics, mathsProgram, studyTopicsBySubject]);

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
    setSubjects((prev) => {
      if (prev.includes(id)) {
        if (id === "maths") setMathsProgram(null);
        return prev.filter((s) => s !== id);
      }
      if (id === "maths") setMathsProgram("engineering");
      return [...prev, id];
    });
  }

  function toggleStudyTopic(subjectId: SubjectId, topicLabel: string) {
    setStudyTopicsBySubject((prev) => {
      const current = prev[subjectId] ?? [];
      const next = current.includes(topicLabel)
        ? current.filter((topic) => topic !== topicLabel)
        : [...current, topicLabel];

      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[subjectId];
        return copy;
      }

      return { ...prev, [subjectId]: next };
    });
  }

  function selectMode(nextMode: ExamMode) {
    setMode(nextMode);
    if (nextMode !== "study") {
      setStudyTopicsBySubject({});
    }
    setModeSubview("configure");
  }

  function goNext() {
    if (step === "school" && schoolId) setStep("subjects");
    else if (step === "subjects" && subjects.length > 0) {
      setMode(null);
      setModeSubview("pick");
      setStep("mode");
    }
  }

  function goBack() {
    if (step === "mode" && modeSubview === "configure") {
      setModeSubview("pick");
      setMode(null);
      return;
    }
    if (step === "subjects") setStep("school");
    else if (step === "mode") {
      setModeSubview("pick");
      setMode(null);
      setStep("subjects");
    }
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
          ...(mode === "study" &&
      Object.values(studyTopicsBySubject).some((topics) => topics?.length)
        ? { studyTopicsBySubject }
        : {}),
      ...(focusTopics.length ? { focusTopics } : {}),
          ...(subjects.includes("maths") && mathsProgram ? { mathsProgram } : {}),
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
            className="flex items-center gap-3 border-emerald-500/15 bg-emerald-500/8 pl-4 pr-2"
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
          <div className="py-2">
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
                  ariaPressed={isSelected}
                  onClick={() => toggleSubject(subject.id)}
                  className={`bg-gradient-to-br ${subject.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(iconTile, "size-10 shrink-0")}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span aria-hidden className={softCheck(isSelected)}>
                          {isSelected ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className="font-semibold">{subject.name}</span>
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

          {subjects.includes("maths") && (
            <BentoCard className="space-y-4 bg-muted/30">
              <div className="space-y-1">
                <h3 className="font-semibold">Which program are you applying to?</h3>
                <p className="text-sm text-muted-foreground">
                  Conestoga&apos;s Math Skills Assessment uses different question
                  ranges by program. All applicants are encouraged to complete the
                  full 100-question assessment when possible.
                </p>
              </div>
              <RadioGroup
                value={mathsProgram ?? "engineering"}
                onValueChange={(value) =>
                  setMathsProgram(value as MathsProgramId)
                }
                className="space-y-2"
              >
                {MATHS_PROGRAMS.map((program) => (
                  <Label
                    key={program.id}
                    htmlFor={`maths-program-${program.id}`}
                    className={cn(
                      "flex cursor-pointer gap-3 p-3 transition-colors",
                      softRow(mathsProgram === program.id)
                    )}
                  >
                    <RadioGroupItem
                      id={`maths-program-${program.id}`}
                      value={program.id}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="font-medium leading-none">
                        {program.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {program.questionLimit} questions
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {program.description}
                      </p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </BentoCard>
          )}
        </section>
      )}

      {step === "mode" && modeSubview === "pick" && (
        <section key="mode-pick" className="setup-step-enter space-y-4">
          <h2 className="text-lg font-semibold">Select exam mode</h2>
          <p className="text-sm text-muted-foreground">
            Choose how you want to practice. You can fine-tune settings on the
            next screen.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MODES.map((m) => {
              const ModeIcon = getModeIcon(m.id);

              return (
                <BentoCard
                  key={m.id}
                  onClick={() => selectMode(m.id)}
                  className="bg-gradient-to-br from-background to-muted/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(iconTile, "size-10 bg-primary/10 text-primary")}>
                        <ModeIcon className="size-5" />
                      </div>
                      <h3 className="text-lg font-semibold">{m.name}</h3>
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
        </section>
      )}

      {step === "mode" && modeSubview === "configure" && mode && (
        <section key="mode-configure" className="setup-step-enter space-y-4">
          {(() => {
            const modeConfig = MODES.find((m) => m.id === mode)!;
            const ModeIcon = getModeIcon(mode);

            return (
              <>
                <div className={cn(shell, "flex items-center gap-3 p-4")}>
                  <div className={cn(iconTile, "size-10 shrink-0 bg-primary/10 text-primary")}>
                    <ModeIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{modeConfig.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {modeConfig.description}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

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
                        className={cn(surface, "group p-2")}
                        open
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between p-3 font-medium [&::-webkit-details-marker]:hidden">
                          {subject?.name}
                          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid gap-3 p-2 pt-1 sm:grid-cols-3">
                          {fields}
                        </div>
                      </details>
                    );
                  }

                  return (
                    <div
                      key={subjectId}
                      className={cn(surface, "grid gap-3 p-3 sm:grid-cols-3")}
                    >
                      <p className="font-medium sm:col-span-3">{subject?.name}</p>
                      {fields}
                    </div>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {mode === "study" && (
            <BentoCard className="space-y-4 bg-muted/30">
              <div className="space-y-1">
                <h3 className="font-semibold">Study by topic</h3>
                <p className="text-sm text-muted-foreground">
                  Expand a subject and pick one or more topics. Leave empty to
                  study across all topics.
                </p>
              </div>
              <div className="space-y-2">
                {subjects.map((subjectId) => {
                  const subject = SUBJECTS.find((s) => s.id === subjectId);
                  const subjectStats = displayStats?.bySubject.find(
                    (s) => s.subjectId === subjectId
                  );
                  const topics = subjectStats?.topics ?? [];
                  const selectedTopics = studyTopicsBySubject[subjectId] ?? [];
                  const totalPoolSize =
                    subjectStats?.totalPoolSize ?? subjectStats?.poolSize ?? 0;

                  return (
                      <details
                        key={subjectId}
                        className={cn(surface, "group p-2")}
                      >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-surface)] p-2 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0 text-left">
                          <p className="font-medium">
                            {subjects.length > 1 ? subject?.name : "Topics"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatStudyTopicSummary(selectedTopics, totalPoolSize)}
                          </p>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-1.5 p-2 pt-1">
                        {topics.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No topics found in this bank yet.
                          </p>
                        ) : (
                          topics.map((topic) => {
                            const isSelected = selectedTopics.includes(topic.label);

                            return (
                              <button
                                key={`${subjectId}-${topic.label}`}
                                type="button"
                                onClick={() =>
                                  toggleStudyTopic(subjectId, topic.label)
                                }
                                className={cn(
                                  "flex w-full items-center gap-3 p-3 text-left",
                                  softRow(isSelected)
                                )}
                              >
                                <span aria-hidden className={softCheck(isSelected)}>
                                  {isSelected ? <Check className="size-3.5" /> : null}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium leading-none">
                                    {topic.label}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {topic.count} question
                                    {topic.count === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                        {selectedTopics.length > 0 &&
                          subjectStats?.questionCount === 0 && (
                            <p className="text-xs text-destructive">
                              No questions available for the selected topics yet.
                            </p>
                          )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </BentoCard>
          )}

          {focusTopics.length > 0 && mode !== "study" && (
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
                    <div className={cn(statTile, "p-3 text-center")}>
                      <p className="text-2xl font-bold">{displayStats.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">Exam questions</p>
                    </div>
                    <div className={cn(statTile, "p-3 text-center")}>
                      <p className="text-2xl font-bold">{subjects.length}</p>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                    <div className={cn(statTile, "p-3 text-center")}>
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
                    const mathsTrack =
                      s.subjectId === "maths" && mathsProgram
                        ? MATHS_PROGRAMS.find((p) => p.id === mathsProgram)?.label
                        : null;
                    const studyTopics =
                      s.subjectId && studyTopicsBySubject[s.subjectId];
                    const topicLabel =
                      studyTopics && studyTopics.length > 0
                        ? studyTopics.map(formatTopicLabel).join(", ")
                        : null;
                    return (
                      <p key={s.subjectId} className="text-xs text-muted-foreground">
                        {subject?.name}: {s.questionCount} questions · {timeLabel}
                        {topicLabel ? ` · ${topicLabel}` : null}
                        {mathsTrack ? ` · ${mathsTrack}` : null}
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
          onContinue={step === "mode" ? startExam : goNext}
          showContinue={step !== "mode" || modeSubview === "configure"}
          backLabel={
            step === "mode" && modeSubview === "configure"
              ? "Change mode"
              : "Back"
          }
          continueLabel={
            step === "mode" && mode
              ? `Start ${getModeStartLabel(mode)}`
              : "Continue"
          }
          continueDisabled={
            step === "subjects"
              ? subjects.length === 0 ||
                (subjects.includes("maths") && !mathsProgram)
              : step === "mode"
                ? !mode || !displayStats || !canStart
                : false
          }
          continueLoading={starting}
        />
      )}
    </>
  );
}
