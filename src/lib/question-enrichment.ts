import type { Question } from "@/types/exam";
import { hasSolutionContent } from "@/lib/solution";
import { getQuestionSolution } from "@/lib/solution";
import { isTextGradedQuestion } from "@/lib/question-type";

/** True when a question has enough tutoring content for students */
export function isQuestionEnriched(question: Question): boolean {
  if (!hasSolutionContent(question)) return false;

  if (isTextGradedQuestion(question)) {
    const steps = getQuestionSolution(question)?.steps.length ?? 0;
    return steps >= 1 || Boolean(question.explanation?.trim());
  }

  if (question.distractors?.length) return true;
  if (!question.wrongAnswerHints || !question.options?.length) return false;

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
