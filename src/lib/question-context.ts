import type { Question, QuestionContext, QuestionContextType } from "@/types/exam";

/** Question text that usually requires a passage, figure, or notice. */
const PASSAGE_DEPENDENT_TEXT =
  /\b(according to|in the (story|poem|passage|notice|chart|table|graph)|figure\s+\d+|the story|the poet|the passage|the notice|in figure)\b/i;

export function isContextAnchoredQuestion(question: Question): boolean {
  return Boolean(question.contextId?.trim());
}

export function looksContextDependent(question: Question): boolean {
  return PASSAGE_DEPENDENT_TEXT.test(question.text ?? "");
}

const LABELS: Record<QuestionContextType, string> = {
  passage: "Reading passage",
  comprehension: "Comprehension",
  graph: "Graph",
  table: "Table",
  diagram: "Diagram",
  image: "Figure",
};

export function getContextLabel(type: QuestionContextType, title?: string): string {
  return title?.trim() || LABELS[type];
}

export function resolveQuestionContext(
  question: Question,
  bankContexts?: Record<string, QuestionContext>
): QuestionContext | undefined {
  if (question.context) return question.context;
  if (question.contextId && bankContexts?.[question.contextId]) {
    return bankContexts[question.contextId];
  }
  return undefined;
}

export function getContextKey(context: QuestionContext, fallbackId: string): string {
  return context.id ?? fallbackId;
}
