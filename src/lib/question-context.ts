import type { Question, QuestionContext, QuestionContextType } from "@/types/exam";

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
