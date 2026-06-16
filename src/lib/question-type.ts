import type { QuestionType } from "@/types/exam";

/** Supported questionType values for bank JSON */
export const QUESTION_TYPES = [
  "multiple_choice",
  "multi_select",
  "numeric",
  "short_answer",
  "essay",
  "true_false",
] as const satisfies readonly QuestionType[];

const QUESTION_TYPE_SET = new Set<string>(QUESTION_TYPES);

export function isKnownQuestionType(value: string): value is QuestionType {
  return QUESTION_TYPE_SET.has(value);
}

/** Legacy alias from early bank patches */
export function coerceQuestionType(raw: string | undefined): QuestionType | undefined {
  if (!raw) return undefined;
  if (raw === "choice") return "multiple_choice";
  if (isKnownQuestionType(raw)) return raw;
  return undefined;
}

export type QuestionShape = {
  questionType?: QuestionType;
  options?: string[];
  answer?: string;
};

export function isChoiceQuestion(question: QuestionShape): boolean {
  const type = question.questionType;
  if (type === "multiple_choice" || type === "true_false") return true;
  if (
    type === "numeric" ||
    type === "short_answer" ||
    type === "essay" ||
    type === "multi_select"
  ) {
    return false;
  }
  return Boolean(question.options?.length);
}

/** Free-response questions graded against answer / acceptedAnswers */
export function isTextGradedQuestion(question: QuestionShape): boolean {
  const type = question.questionType;
  if (type === "numeric" || type === "short_answer") return true;
  if (isChoiceQuestion(question)) return false;
  return Boolean(question.answer) && !question.options?.length;
}

export function isEssayQuestion(question: QuestionShape): boolean {
  return question.questionType === "essay";
}

/** @deprecated Use isTextGradedQuestion */
export function isNumericQuestion(question: QuestionShape): boolean {
  return isTextGradedQuestion(question);
}
