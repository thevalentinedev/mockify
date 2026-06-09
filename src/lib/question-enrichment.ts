import type { Question } from "@/types/exam";

/** True when explanation + wrong-answer hints exist for every incorrect option */
export function isQuestionEnriched(question: Question): boolean {
  if (!question.explanation?.trim()) return false;
  if (!question.wrongAnswerHints) return false;

  const wrongIndices = question.options
    .map((_, index) => index)
    .filter((index) => index !== question.correctIndex);

  return wrongIndices.every((index) =>
    Boolean(question.wrongAnswerHints?.[String(index)]?.trim())
  );
}

export function getUnenrichedQuestions(questions: Question[]): Question[] {
  return questions.filter((question) => !isQuestionEnriched(question));
}

export function countEnrichedQuestions(questions: Question[]): number {
  return questions.filter(isQuestionEnriched).length;
}
