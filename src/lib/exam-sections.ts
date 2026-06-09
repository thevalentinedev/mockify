import { getExamSpec, getModeTimeLimitMinutes } from "@/lib/exam-config";
import type {
  ExamProgress,
  ExamSession,
  ShuffledQuestion,
  SubjectId,
  SubjectSection,
} from "@/types/exam";

export function buildSectionsFromQuestions(
  schoolId: ExamSession["schoolId"],
  subjects: SubjectId[],
  mode: ExamSession["mode"],
  questions: ShuffledQuestion[],
  startedAt: number,
  customTimeLimitMinutes?: number
): SubjectSection[] {
  const grouped = new Map<SubjectId, ShuffledQuestion[]>();
  for (const q of questions) {
    const list = grouped.get(q.subjectId) ?? [];
    list.push(q);
    grouped.set(q.subjectId, list);
  }

  return subjects
    .filter((id) => (grouped.get(id)?.length ?? 0) > 0)
    .map((subjectId) => {
      const spec = getExamSpec(schoolId, subjectId);
      const baseSpec = spec ?? { questionCount: 0, timeLimitMinutes: 0 };
      return {
        subjectId,
        questions: grouped.get(subjectId) ?? [],
        timeLimitMinutes: getModeTimeLimitMinutes(mode, baseSpec, {
          customTimeLimitMinutes,
        }),
        startedAt,
      };
    });
}

/** Support sessions saved before per-subject sections existed */
export function normalizeSession(session: ExamSession): ExamSession {
  if (session.sections?.length) return session;

  const questions = session.questions ?? [];
  if (!questions.length) return { ...session, sections: [] };

  const firstSubject = session.subjects[0];
  const legacyCustomTime = firstSubject
    ? session.customOptions?.perSubject?.[firstSubject]?.timeLimitMinutes
    : undefined;

  const sections = buildSectionsFromQuestions(
    session.schoolId,
    session.subjects,
    session.mode,
    questions,
    session.startedAt,
    legacyCustomTime
  );

  return { ...session, sections };
}

export function getAllQuestions(session: ExamSession): ShuffledQuestion[] {
  const normalized = normalizeSession(session);
  return normalized.sections.flatMap((s) => s.questions);
}

export function getCurrentSection(
  session: ExamSession,
  subjectIndex: number
): SubjectSection | null {
  const normalized = normalizeSession(session);
  return normalized.sections[subjectIndex] ?? null;
}

function withProgressDefaults(progress: ExamProgress): ExamProgress {
  return {
    ...progress,
    flaggedQuestionIds: progress.flaggedQuestionIds ?? [],
    questionTimeMs: progress.questionTimeMs ?? {},
    completedSubjects: progress.completedSubjects ?? [],
  };
}

export function normalizeProgress(
  session: ExamSession,
  progress: ExamProgress
): ExamProgress {
  if (progress.currentSubjectIndex !== undefined) {
    return withProgressDefaults(progress);
  }

  const normalized = normalizeSession(session);
  const allQuestions = getAllQuestions(session);
  const currentQ = allQuestions[progress.currentIndex];
  let subjectIndex = 0;
  let indexInSubject = progress.currentIndex;

  if (currentQ) {
    subjectIndex = normalized.sections.findIndex(
      (s) => s.subjectId === currentQ.subjectId
    );
    if (subjectIndex >= 0) {
      const section = normalized.sections[subjectIndex];
      indexInSubject = section.questions.findIndex((q) => q.id === currentQ.id);
      if (indexInSubject < 0) indexInSubject = 0;
    } else {
      subjectIndex = 0;
      indexInSubject = 0;
    }
  }

  return withProgressDefaults({
    ...progress,
    currentSubjectIndex: Math.max(0, subjectIndex),
    currentIndex: indexInSubject,
  });
}

export function isSubjectCompleted(
  progress: ExamProgress,
  subjectId: SubjectId
): boolean {
  return progress.completedSubjects?.includes(subjectId) ?? false;
}
