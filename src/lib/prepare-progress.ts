import { getExamSpec } from "@/lib/exam-config";
import type { SchoolId, SubjectId } from "@/types/exam";

export type PreparePhase =
  | "starting"
  | "reading-pdf"
  | "extracting"
  | "enriching"
  | "generating"
  | "twisting"
  | "finishing"
  | "done";

export interface SubjectPrepareProgress {
  subjectId: SubjectId;
  phase: PreparePhase;
  poolSize: number;
  target: number;
  enrichedCount: number;
  message: string;
}

export interface PrepareProgress {
  jobId: string;
  schoolId: SchoolId;
  subjects: SubjectPrepareProgress[];
  updatedAt: number;
}

const store = new Map<string, PrepareProgress>();

const TTL_MS = 30 * 60 * 1000;

function pruneStale() {
  const now = Date.now();
  for (const [jobId, progress] of store) {
    if (now - progress.updatedAt > TTL_MS) store.delete(jobId);
  }
}

export function initPrepareJob(
  jobId: string,
  schoolId: SchoolId,
  subjects: SubjectId[]
): PrepareProgress {
  pruneStale();
  const progress: PrepareProgress = {
    jobId,
    schoolId,
    subjects: subjects.map((subjectId) => {
      const target = getExamSpec(schoolId, subjectId)?.questionCount ?? 0;
      return {
        subjectId,
        phase: "starting",
        poolSize: 0,
        target,
        enrichedCount: 0,
        message: "Starting…",
      };
    }),
    updatedAt: Date.now(),
  };
  store.set(jobId, progress);
  return progress;
}

export function updateSubjectPrepareProgress(
  jobId: string,
  subjectId: SubjectId,
  patch: Partial<Omit<SubjectPrepareProgress, "subjectId">>
): void {
  const progress = store.get(jobId);
  if (!progress) return;

  const definedPatch = Object.fromEntries(
    Object.entries(patch).filter((entry) => entry[1] !== undefined)
  ) as Partial<Omit<SubjectPrepareProgress, "subjectId">>;

  progress.subjects = progress.subjects.map((subject) =>
    subject.subjectId === subjectId ? { ...subject, ...definedPatch } : subject
  );
  progress.updatedAt = Date.now();
}

export function getPrepareProgress(jobId: string): PrepareProgress | null {
  return store.get(jobId) ?? null;
}

export function completePrepareJob(jobId: string): void {
  const progress = store.get(jobId);
  if (!progress) return;
  progress.subjects = progress.subjects.map((subject) => ({
    ...subject,
    phase: "done",
    poolSize: Math.max(subject.poolSize, subject.target),
    enrichedCount: Math.max(subject.enrichedCount, subject.poolSize),
    message: "Ready",
  }));
  progress.updatedAt = Date.now();
}

export function clearPrepareJob(jobId: string): void {
  store.delete(jobId);
}

/** Questions in the pool toward the exam target */
export function getReadyCount(subject: SubjectPrepareProgress): number {
  return Math.min(subject.poolSize, subject.target);
}
