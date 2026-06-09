import type { ExamResult, SubjectId } from "@/types/exam";

const HISTORY_KEY = "mock-learning-history";
const PRACTICE_TOPICS_KEY = "mock-practice-topics";

interface LearningHistory {
  wrongQuestionIds: Partial<Record<SubjectId, string[]>>;
  weakTopics: Partial<Record<SubjectId, string[]>>;
}

function readHistory(): LearningHistory {
  if (typeof window === "undefined") {
    return { wrongQuestionIds: {}, weakTopics: {} };
  }
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return { wrongQuestionIds: {}, weakTopics: {} };
  try {
    return JSON.parse(raw) as LearningHistory;
  } catch {
    return { wrongQuestionIds: {}, weakTopics: {} };
  }
}

function writeHistory(history: LearningHistory): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function recordExamResult(result: ExamResult): void {
  const history = readHistory();
  const allQuestions = result.session.sections.flatMap((s) => s.questions);

  for (const question of allQuestions) {
    const answer = result.answers.find((a) => a.questionId === question.id);
    const isCorrect = answer?.selectedIndex === question.correctIndex;
    if (isCorrect) continue;

    const subjectId = question.subjectId;
    const wrongIds = new Set(history.wrongQuestionIds[subjectId] ?? []);
    wrongIds.add(question.originalId);
    history.wrongQuestionIds[subjectId] = [...wrongIds].slice(-80);

    if (question.topic) {
      const topics = new Set(history.weakTopics[subjectId] ?? []);
      topics.add(question.topic);
      history.weakTopics[subjectId] = [...topics].slice(-20);
    }
  }

  writeHistory(history);
}

export function getWeakTopics(subjectId?: SubjectId): string[] {
  const history = readHistory();
  if (subjectId) return history.weakTopics[subjectId] ?? [];
  return Object.values(history.weakTopics).flat();
}

export function getWrongQuestionIds(subjectId: SubjectId): string[] {
  return readHistory().wrongQuestionIds[subjectId] ?? [];
}

export function savePracticeTopics(topics: string[]): void {
  sessionStorage.setItem(PRACTICE_TOPICS_KEY, JSON.stringify(topics));
}

export function loadPracticeTopics(): string[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(PRACTICE_TOPICS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function clearPracticeTopics(): void {
  sessionStorage.removeItem(PRACTICE_TOPICS_KEY);
}
