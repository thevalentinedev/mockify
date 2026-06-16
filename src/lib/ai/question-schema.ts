import { z } from "zod";
import { difficultyZod } from "@/lib/difficulty";
import { buildTagsFromTopics } from "@/lib/tags";
import { isTextGradedQuestion } from "@/lib/question-type";
import { isContextAnchoredQuestion } from "@/lib/question-context";
import type {
  AnswerConfidence,
  Question,
  QuestionDistractor,
  QuestionSolution,
  QuestionType,
} from "@/types/exam";

/** OpenAI structured outputs require every key — use null instead of omitting. */
function nullish<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}

export const aiDistractorSchema = z.object({
  answer: z.string(),
  reason: z.string(),
});

export const aiSolutionSchema = z.object({
  steps: z.array(z.string()).min(1),
  finalAnswer: z.union([z.string(), z.null()]),
});

export const aiWrongHintSchema = z.object({
  optionIndex: z.number().int(),
  hint: z.string(),
});

export const aiEnrichedQuestionSchema = z.object({
  id: z.string(),
  /** Temp id into chunk-level contexts[] when enrichment creates missing material */
  contextId: z.string().nullable(),
  answerConfidence: z.enum(["high", "medium", "low"]),
  questionType: z
    .enum(["multiple_choice", "numeric", "short_answer", "true_false"])
    .nullable(),
  correctIndex: z.number().int().nullable(),
  answer: z.string().nullable(),
  acceptedAnswers: z.array(z.string()).nullable(),
  explanation: z.string(),
  solution: aiSolutionSchema.nullable(),
  distractors: z.array(aiDistractorSchema).nullable(),
  wrongAnswerHints: z.array(aiWrongHintSchema).nullable(),
  learningObjective: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  topics: z.array(z.string()),
  difficulty: difficultyZod,
});

export const aiGeneratedQuestionSchema = aiEnrichedQuestionSchema
  .omit({ id: true })
  .extend({
    text: z.string(),
    options: z.array(z.string()).min(2).max(6).nullable(),
    contextId: z.string().nullable(),
  });

export type AiEnrichedQuestion = z.infer<typeof aiEnrichedQuestionSchema>;
export type AiGeneratedQuestion = z.infer<typeof aiGeneratedQuestionSchema>;

export function isPublishableConfidence(
  confidence: AnswerConfidence | undefined
): boolean {
  return confidence === "high";
}

export function hintsToDistractors(
  options: string[],
  correctIndex: number,
  hints: Record<string, string>
): QuestionDistractor[] {
  return Object.entries(hints)
    .map(([indexKey, reason]) => {
      const index = Number(indexKey);
      const answer = options[index];
      if (!answer?.trim() || !reason?.trim() || index === correctIndex) return null;
      return { answer, reason: reason.trim() };
    })
    .filter((item): item is QuestionDistractor => item !== null);
}

export function distractorsToHints(
  options: string[],
  distractors: QuestionDistractor[]
): Record<string, string> {
  const hints: Record<string, string> = {};
  for (const distractor of distractors) {
    const index = options.findIndex((option) => option === distractor.answer);
    if (index >= 0) hints[String(index)] = distractor.reason;
  }
  return hints;
}

function resolveQuestionType(
  original: Question,
  enriched: AiEnrichedQuestion
): QuestionType | undefined {
  if (original.questionType) return original.questionType;
  const enrichedType = nullish(enriched.questionType);
  if (enrichedType) return enrichedType;
  if (isTextGradedQuestion(original)) return "numeric";
  if (original.options?.length) return "multiple_choice";
  return undefined;
}

export function applyAiEnrichment(
  original: Question,
  enriched: AiEnrichedQuestion,
  options?: { resolvedContextId?: string }
): Question | null {
  if (!isPublishableConfidence(enriched.answerConfidence)) {
    return null;
  }

  const questionType = resolveQuestionType(original, enriched);
  const isNumeric = questionType === "numeric" || isTextGradedQuestion(original);
  const lockAnswerFields = isContextAnchoredQuestion(original);

  const distractors =
    enriched.distractors?.length
      ? enriched.distractors
      : !isNumeric &&
          original.options?.length &&
          enriched.wrongAnswerHints?.length
        ? enriched.wrongAnswerHints
            .filter((hint) => hint.optionIndex !== enriched.correctIndex)
            .map((hint) => ({
              answer: original.options![hint.optionIndex] ?? "",
              reason: hint.hint,
            }))
            .filter((d) => d.answer && d.reason)
        : original.distractors;

  const wrongAnswerHints =
    !isNumeric && original.options?.length && distractors?.length
      ? distractorsToHints(original.options, distractors)
      : original.wrongAnswerHints;

  const topics = enriched.topics.length
    ? enriched.topics
    : (original.meta?.topics ?? []);
  const tags = enriched.tags?.length
    ? enriched.tags
    : buildTagsFromTopics(topics);

  const solution: QuestionSolution | undefined =
    enriched.solution?.steps.length
      ? {
          steps: enriched.solution.steps,
          finalAnswer:
            nullish(enriched.solution.finalAnswer) ??
            nullish(enriched.answer) ??
            original.answer,
        }
      : original.solution;

  const contextId =
    original.contextId ??
    options?.resolvedContextId ??
    nullish(enriched.contextId);

  const next: Question = {
    ...original,
    ...(contextId ? { contextId } : {}),
    questionType,
    explanation: enriched.explanation,
    solution,
    distractors,
    wrongAnswerHints,
    meta: {
      ...(original.meta ?? { topics: [], source: "verified" }),
      topics,
      tags,
      learningObjective:
        nullish(enriched.learningObjective) ?? original.meta?.learningObjective,
      difficulty: enriched.difficulty,
      source: original.meta?.source === "generated" ? "generated" : "verified",
      verifiedAt: new Date().toISOString(),
      answerConfidence: enriched.answerConfidence,
    },
  };

  if (isNumeric) {
    if (!lockAnswerFields) {
      next.answer = nullish(enriched.answer) ?? original.answer;
      next.acceptedAnswers =
        nullish(enriched.acceptedAnswers) ?? original.acceptedAnswers;
    }
    delete next.options;
    delete next.correctIndex;
    delete next.wrongAnswerHints;
  } else {
    if (!lockAnswerFields) {
      next.correctIndex =
        nullish(enriched.correctIndex) ?? original.correctIndex ?? 0;
    }
    next.options = original.options;
  }

  return next;
}

export function applyAiGeneratedQuestion(
  base: Omit<Question, "id"> & { id: string },
  generated: AiGeneratedQuestion
): Question | null {
  return applyAiEnrichment(
    {
      ...base,
      options: nullish(generated.options) ?? base.options,
      meta: base.meta ?? { topics: [], source: "generated" },
    },
    { ...generated, id: base.id }
  );
}

export const CONTEXT_ENRICHMENT_RULES = `Context / reading material rules:
- When referencedContext is provided, answer ONLY from that material. Do not create a new context.
- When question text refers to a story, passage, poem, chart, table, figure, or notice but referencedContext is null, create the missing material in the chunk-level contexts[] array and set contextId on that question to the matching context id.
- Reuse the same context id when multiple questions in the chunk share one passage or figure.
- Standalone general-knowledge questions (no implied passage) should leave contextId null and must not get a spurious context.
- Passage/comprehension content must be long enough to answer the question (typically 2–6 sentences for narratives, or full notice/chart text for functional reading).`;

export const ENRICHMENT_PROMPT_RULES = `Quality rules:
- answerConfidence must be "high" only when you are certain the answer and reasoning are correct. Use "medium" or "low" if unsure — those questions will be discarded.
- For numeric/free-response: provide solution with steps (2-5 short steps) and finalAnswer string. Include acceptedAnswers for alternate forms (fractions, decimals).
- For multiple-choice: provide distractors[] with { answer, reason } explaining the student misconception. Set solution.finalAnswer to null when the correct option letter/value is enough.
- Use null for fields that do not apply (e.g. options on numeric questions, distractors on numeric).
- learningObjective: one specific skill sentence (e.g. "Add fractions with unlike denominators").
- tags: 2-5 short searchable labels (e.g. fractions, lcd, arithmetic).
- difficulty: 1=very easy, 2=easy, 3=medium, 4=hard, 5=very hard.`;
