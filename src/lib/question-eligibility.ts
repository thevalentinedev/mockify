import { isPublishableConfidence } from "@/lib/ai/question-schema";
import { isTextGradedQuestion } from "@/lib/question-type";
import { getQuestionSolution, hasSolutionContent } from "@/lib/solution";
import type { Question, QuestionBank } from "@/types/exam";

export { isPublishableConfidence };

export function isExamEligibleQuestion(question: Question): boolean {
  if (!isPublishableConfidence(question.meta?.answerConfidence)) return false;

  if (isTextGradedQuestion(question)) {
    const solution = getQuestionSolution(question);
    return Boolean(
      solution?.steps.length ||
        question.explanation?.trim() ||
        question.answer?.trim()
    );
  }

  if (!hasSolutionContent(question)) return false;

  if (question.options?.length) {
    return Boolean(
      question.distractors?.length ||
        Object.keys(question.wrongAnswerHints ?? {}).length > 0
    );
  }

  return true;
}

export function filterExamEligibleQuestions(questions: Question[]): Question[] {
  return questions.filter(isExamEligibleQuestion);
}

export function countExamEligibleQuestions(questions: Question[]): number {
  return filterExamEligibleQuestions(questions).length;
}

export function pruneIneligibleQuestions(questions: Question[]): {
  kept: Question[];
  removed: Question[];
} {
  const kept: Question[] = [];
  const removed: Question[] = [];

  for (const question of questions) {
    if (isExamEligibleQuestion(question)) {
      kept.push(question);
    } else {
      removed.push(question);
    }
  }

  return { kept, removed };
}

export function pruneQuestionBank(bank: QuestionBank): {
  bank: QuestionBank;
  removed: Question[];
} {
  const { kept, removed } = pruneIneligibleQuestions(bank.questions);
  if (removed.length === 0) {
    return { bank, removed: [] };
  }

  return {
    bank: { ...bank, questions: kept },
    removed,
  };
}
