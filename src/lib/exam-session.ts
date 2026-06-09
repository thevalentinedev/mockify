import type { ExamProgress, ExamSession } from "@/types/exam";

const SESSION_KEY = "mock-exam-session";
const PROGRESS_KEY = "mock-exam-progress";
const RESULT_KEY = "mock-exam-result";

/** Legacy keys — migrate once from sessionStorage */
const LEGACY_SESSION_KEY = "exam-session";
const LEGACY_RESULT_KEY = "exam-result";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem(key);
  if (local) return local;
  const legacy = sessionStorage.getItem(key);
  if (legacy) {
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
  }
  return legacy;
}

function writeStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function removeStorage(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function saveSession(session: ExamSession): void {
  writeStorage(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): ExamSession | null {
  const raw =
    readStorage(SESSION_KEY) ?? readStorage(LEGACY_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ExamSession;
    writeStorage(SESSION_KEY, raw);
    return session;
  } catch {
    return null;
  }
}

export function saveProgress(
  session: ExamSession,
  progress: Omit<ExamProgress, "startedAt" | "updatedAt">
): void {
  const payload: ExamProgress = {
    startedAt: session.startedAt,
    currentSubjectIndex: progress.currentSubjectIndex ?? 0,
    currentIndex: progress.currentIndex,
    answers: progress.answers,
    showReview: progress.showReview,
    completedSubjects: progress.completedSubjects ?? [],
    flaggedQuestionIds: progress.flaggedQuestionIds ?? [],
    questionTimeMs: progress.questionTimeMs ?? {},
    questionOpenedAt: progress.questionOpenedAt,
    updatedAt: Date.now(),
  };
  writeStorage(PROGRESS_KEY, JSON.stringify(payload));
}

export function loadProgress(session: ExamSession): ExamProgress | null {
  const raw = readStorage(PROGRESS_KEY);
  if (!raw) return null;
  try {
    const progress = JSON.parse(raw) as ExamProgress;
    if (progress.startedAt !== session.startedAt) return null;
    return progress;
  } catch {
    return null;
  }
}

export function formatLastSaved(updatedAt: number): string {
  const seconds = Math.floor((Date.now() - updatedAt) / 1000);
  if (seconds < 10) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Saved ${minutes}m ago`;
}

export function hasActiveExam(): boolean {
  return loadSession() !== null;
}

export function clearExamInProgress(): void {
  removeStorage(SESSION_KEY);
  removeStorage(PROGRESS_KEY);
  removeStorage(LEGACY_SESSION_KEY);
  removeStorage(LEGACY_RESULT_KEY);
}

export function clearSession(): void {
  clearExamInProgress();
}

export function saveResult(result: unknown): void {
  writeStorage(RESULT_KEY, JSON.stringify(result));
}

export function loadResult<T>(): T | null {
  const raw =
    readStorage(RESULT_KEY) ?? readStorage(LEGACY_RESULT_KEY);
  if (!raw) return null;
  try {
    writeStorage(RESULT_KEY, raw);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  removeStorage(RESULT_KEY);
  sessionStorage.removeItem(LEGACY_RESULT_KEY);
}

/** Called when starting a fresh exam — wipes any in-progress attempt */
export function startNewExam(session: ExamSession): void {
  clearExamInProgress();
  saveSession(session);
  saveProgress(session, {
    currentSubjectIndex: 0,
    currentIndex: 0,
    answers: [],
    showReview: false,
    completedSubjects: [],
    flaggedQuestionIds: [],
    questionTimeMs: {},
    questionOpenedAt: Date.now(),
  });
}
