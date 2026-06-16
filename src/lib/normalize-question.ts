import { coerceDifficulty } from "@/lib/difficulty";
import { buildDistractorsFromHints } from "@/lib/distractors";
import { buildTagsFromTopics } from "@/lib/tags";
import type { Question, QuestionBank, QuestionMeta, QuestionType } from "@/types/exam";

function resolveQuestionType(question: Question): QuestionType {
  const raw = question.questionType as string | undefined;
  if (raw === "choice") return "multiple_choice";
  if (question.questionType) return question.questionType;

  if (question.answer && !question.options?.length) return "numeric";
  if (question.options?.length === 2) return "true_false";
  if (question.options?.length) return "multiple_choice";

  return "multiple_choice";
}

function resolveDistractors(question: Question) {
  if (question.distractors?.length) return question.distractors;
  return buildDistractorsFromHints(question);
}

function resolveTags(question: Question): string[] | undefined {
  if (question.tags?.length) return question.tags;
  if (question.meta?.tags?.length) return question.meta.tags;
  if (question.meta?.topics?.length) {
    return buildTagsFromTopics(question.meta.topics);
  }
  return undefined;
}

function resolveMeta(question: Question): QuestionMeta | undefined {
  if (!question.meta) return undefined;

  const learningObjective =
    question.learningObjective ?? question.meta.learningObjective;
  const difficulty = coerceDifficulty(question.meta.difficulty);
  const tags = resolveTags(question);

  const next: QuestionMeta = {
    ...question.meta,
    ...(learningObjective ? { learningObjective } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(tags?.length ? { tags } : {}),
  };

  if (
    next.learningObjective === question.meta.learningObjective &&
    next.difficulty === question.meta.difficulty &&
    next.tags === question.meta.tags
  ) {
    return question.meta;
  }

  return next;
}

export function normalizeQuestion(question: Question): Question {
  const questionType = resolveQuestionType(question);
  const meta = resolveMeta(question);
  const distractors = resolveDistractors(question);
  const hasTopLevelObjective = Boolean(question.learningObjective);
  const hasTopLevelTags = Boolean(question.tags?.length);

  const needsTypeUpdate = question.questionType !== questionType;
  const needsMetaUpdate = meta !== question.meta;
  const needsObjectiveHoist = hasTopLevelObjective;
  const needsTagHoist = hasTopLevelTags;
  const needsDistractors =
    Boolean(distractors?.length) && distractors !== question.distractors;

  if (
    !needsTypeUpdate &&
    !needsMetaUpdate &&
    !needsObjectiveHoist &&
    !needsTagHoist &&
    !needsDistractors
  ) {
    return question;
  }

  const rest = { ...question };
  delete rest.learningObjective;
  delete rest.tags;
  return {
    ...rest,
    questionType,
    ...(distractors ? { distractors } : {}),
    ...(meta ? { meta } : {}),
  };
}

export function normalizeQuestionBank(bank: QuestionBank): QuestionBank {
  const questions = bank.questions.map(normalizeQuestion);
  const changed = questions.some((q, i) => q !== bank.questions[i]);
  if (!changed) return bank;
  return { ...bank, questions };
}
