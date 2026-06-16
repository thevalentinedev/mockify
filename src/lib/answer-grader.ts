import type { ExamAnswer, Question, ShuffledQuestion } from "@/types/exam";
import {
  isTextGradedQuestion,
} from "@/lib/question-type";

export type GradableQuestion = Pick<
  Question | ShuffledQuestion,
  "questionType" | "options" | "answer" | "acceptedAnswers" | "correctIndex"
>;

export {
  isChoiceQuestion,
  isNumericQuestion,
  isTextGradedQuestion,
} from "@/lib/question-type";

export function normalizeNumericAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getAcceptedAnswers(question: GradableQuestion): string[] {
  const values = [question.answer, ...(question.acceptedAnswers ?? [])].filter(
    (value): value is string => Boolean(value?.trim())
  );
  return [...new Set(values.map(normalizeNumericAnswer))];
}

export function isAnswerCorrect(
  question: GradableQuestion,
  answer: ExamAnswer | undefined
): boolean {
  if (!answer) return false;

  if (isTextGradedQuestion(question)) {
    const text = answer.textAnswer?.trim();
    if (!text) return false;
    return getAcceptedAnswers(question).includes(normalizeNumericAnswer(text));
  }

  return (
    answer.selectedIndex !== null &&
    answer.selectedIndex !== undefined &&
    answer.selectedIndex === question.correctIndex
  );
}

export function hasAnsweredQuestion(
  question: GradableQuestion,
  answer: ExamAnswer | undefined
): boolean {
  if (!answer) return false;

  if (isTextGradedQuestion(question)) {
    return Boolean(answer.textAnswer?.trim());
  }

  return answer.selectedIndex !== null && answer.selectedIndex !== undefined;
}

export function formatCorrectAnswer(question: GradableQuestion): string {
  if (isTextGradedQuestion(question)) {
    return question.answer ?? "";
  }
  if (
    question.correctIndex !== undefined &&
    question.options?.[question.correctIndex]
  ) {
    return `${String.fromCharCode(65 + question.correctIndex)}. ${question.options[question.correctIndex]}`;
  }
  if (question.correctIndex !== undefined) {
    return String.fromCharCode(65 + question.correctIndex);
  }
  return "";
}
