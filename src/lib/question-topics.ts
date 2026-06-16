import { matchesFocusTarget } from "@/lib/tags";
import type { Question } from "@/types/exam";

export const ALL_STUDY_TOPICS = "__all__";

export interface StudyTopicOption {
  label: string;
  count: number;
}

/** Display form — first letter capitalized, rest unchanged */
export function formatTopicLabel(topic: string): string {
  const trimmed = topic.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Unique topics from question meta with eligible-question counts */
export function collectStudyTopics(questions: Question[]): StudyTopicOption[] {
  const counts = new Map<string, StudyTopicOption>();

  for (const question of questions) {
    const seenForQuestion = new Set<string>();

    for (const topic of question.meta?.topics ?? []) {
      const trimmed = topic.trim();
      if (!trimmed) continue;

      const key = trimmed.toLowerCase();
      if (seenForQuestion.has(key)) continue;
      seenForQuestion.add(key);

      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label: formatTopicLabel(trimmed), count: 1 });
      }
    }
  }

  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function isAllStudyTopics(topics: string[] | undefined | null): boolean {
  return !topics?.length;
}

export function filterQuestionsByStudyTopics(
  questions: Question[],
  topics: string[] | undefined | null
): Question[] {
  if (isAllStudyTopics(topics)) return questions;
  return questions.filter((question) =>
    topics!.some((topic) => matchesFocusTarget(question, topic))
  );
}

/** @deprecated Use filterQuestionsByStudyTopics */
export function filterQuestionsByStudyTopic(
  questions: Question[],
  topic: string | undefined | null
): Question[] {
  if (!topic || topic === ALL_STUDY_TOPICS) return questions;
  return filterQuestionsByStudyTopics(questions, [topic]);
}
