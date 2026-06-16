import type { Question, QuestionSolution, ShuffledQuestion } from "@/types/exam";

type SolutionSource = Pick<Question, "solution" | "explanation" | "answer"> | Pick<
  ShuffledQuestion,
  "solution" | "explanation" | "answer"
>;

export function getQuestionSolution(
  question: SolutionSource
): QuestionSolution | undefined {
  if (question.solution?.steps?.length) return question.solution;
  return undefined;
}

export function hasSolutionContent(question: SolutionSource): boolean {
  return Boolean(
    getQuestionSolution(question)?.steps.length || question.explanation?.trim()
  );
}

export function getExplanationText(question: SolutionSource): string | undefined {
  const solution = getQuestionSolution(question);
  if (solution?.steps.length) {
    return solution.steps.join(" ");
  }
  return question.explanation?.trim() || undefined;
}

export function getDisplayedFinalAnswer(question: SolutionSource): string | undefined {
  const solution = getQuestionSolution(question);
  if (solution?.finalAnswer?.trim()) return solution.finalAnswer.trim();
  if ("answer" in question && question.answer?.trim()) return question.answer.trim();
  return undefined;
}
