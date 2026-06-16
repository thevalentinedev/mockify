import { formatTopicLabel } from "@/lib/question-topics";
import type { Question, ShuffledQuestion } from "@/types/exam";

type ObjectiveSource = Pick<Question, "learningObjective" | "meta"> | Pick<
  ShuffledQuestion,
  "learningObjective" | "topic"
>;

/** Specific skill tested — only when explicitly set in bank JSON */
export function getLearningObjective(
  question: ObjectiveSource
): string | undefined {
  if ("meta" in question) {
    return question.meta?.learningObjective ?? question.learningObjective;
  }
  return question.learningObjective;
}

export function getTopicLabel(question: ObjectiveSource): string | undefined {
  if ("meta" in question && question.meta) {
    const raw = question.meta.topics?.at(-1) ?? question.meta.topics?.[0];
    return raw ? formatTopicLabel(raw) : undefined;
  }
  if ("topic" in question && question.topic) {
    return formatTopicLabel(question.topic);
  }
  return undefined;
}

export function getPracticeLabel(question: ObjectiveSource): string | undefined {
  return getLearningObjective(question) ?? getTopicLabel(question);
}

export { matchesFocusTarget } from "@/lib/tags";
