import { normalizeNumericAnswer } from "@/lib/answer-grader";
import type { ExamAnswer, Question, ShuffledQuestion } from "@/types/exam";

export type DistractorQuestion = Pick<
  Question | ShuffledQuestion,
  "distractors" | "wrongAnswerHints" | "options" | "correctIndex"
>;

export function buildDistractorsFromHints(question: Question): Question["distractors"] {
  if (!question.wrongAnswerHints || !question.options?.length) return undefined;

  const distractors: NonNullable<Question["distractors"]> = [];

  for (const [indexKey, reason] of Object.entries(question.wrongAnswerHints)) {
    const index = Number(indexKey);
    const answer = question.options[index];
    if (!answer?.trim() || !reason?.trim()) continue;
    if (index === question.correctIndex) continue;
    distractors.push({ answer, reason: reason.trim() });
  }

  return distractors.length > 0 ? distractors : undefined;
}

export function getRemediationReason(
  question: DistractorQuestion,
  answer: ExamAnswer | undefined
): string | undefined {
  if (!answer) return undefined;

  if (answer.selectedIndex != null && question.options?.length) {
    const selected = question.options[answer.selectedIndex];
    const fromDistractor = question.distractors?.find(
      (d) => normalizeNumericAnswer(d.answer) === normalizeNumericAnswer(selected)
    )?.reason;
    if (fromDistractor) return fromDistractor;

    return question.wrongAnswerHints?.[String(answer.selectedIndex)];
  }

  const text = answer.textAnswer?.trim();
  if (!text) return undefined;

  return question.distractors?.find(
    (d) => normalizeNumericAnswer(d.answer) === normalizeNumericAnswer(text)
  )?.reason;
}

export function hasDistractorRationale(question: DistractorQuestion): boolean {
  return Boolean(question.distractors?.length || question.wrongAnswerHints);
}
