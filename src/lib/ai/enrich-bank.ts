import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  ENRICHMENT_PROMPT_RULES,
  aiEnrichedQuestionSchema,
  applyAiEnrichment,
} from "@/lib/ai/question-schema";
import { AI_MODEL } from "@/lib/ai/model";
import { pruneIneligibleQuestions } from "@/lib/question-eligibility";
import {
  getUnenrichedQuestions,
  isQuestionEnriched,
} from "@/lib/question-enrichment";
import { isTextGradedQuestion } from "@/lib/question-type";
import type { BankMeta, Question, QuestionBank, SchoolId, SubjectId } from "@/types/exam";

const CHUNK_SIZE = 6;

const blueprintSchema = z.object({
  schoolContext: z.string(),
  topicsCovered: z.array(z.string()),
  examBlueprint: z.array(
    z.object({
      topic: z.string(),
      weight: z.number(),
      questionCount: z.number(),
    })
  ),
});

const enrichChunkSchema = z.object({
  questions: z.array(aiEnrichedQuestionSchema),
});

function formatQuestionForEnrich(question: Question): object {
  const numeric = isTextGradedQuestion(question);
  return {
    id: question.id,
    text: question.text,
    questionType: numeric ? "numeric" : "multiple_choice",
    options: numeric ? undefined : question.options,
    currentCorrectIndex: question.correctIndex,
    answer: question.answer,
    acceptedAnswers: question.acceptedAnswers,
    contextId: question.contextId,
  };
}

export async function analyzeExamBlueprint(
  bank: QuestionBank
): Promise<BankMeta> {
  const sample = bank.questions
    .slice(0, 15)
    .map((q, i) => {
      const numeric = isTextGradedQuestion(q);
      if (numeric) {
        return `${i + 1}. [numeric] ${q.text}\n   Answer: ${q.answer ?? "?"}`;
      }
      return `${i + 1}. ${q.text}\n   Options: ${(q.options ?? []).join(" | ")}`;
    })
    .join("\n\n");

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: blueprintSchema }),
    prompt: `Analyze this ${bank.schoolId} college pre-assessment sample for subject: ${bank.subjectId}.

Infer what this exam tests based on the sample questions. The samples reveal TOPICS covered, not the full question pool.

Return:
- schoolContext: 1-2 sentences about this school/program test style
- topicsCovered: distinct topic labels students must master
- examBlueprint: topic weights (sum to ~100) and how many sample questions mapped to each

SAMPLE QUESTIONS:
${sample}`,
  });

  if (!output) throw new Error("Failed to analyze exam topics");

  return {
    schoolContext: output.schoolContext,
    topicsCovered: output.topicsCovered,
    examBlueprint: output.examBlueprint,
    totalGenerated: bank.meta?.totalGenerated ?? 0,
  };
}

async function enrichQuestionChunk(
  questions: Question[],
  schoolId: SchoolId,
  subjectId: SubjectId,
  topics: string[]
): Promise<z.infer<typeof enrichChunkSchema>["questions"]> {
  const payload = questions.map(formatQuestionForEnrich);

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: enrichChunkSchema }),
    prompt: `You are a ${schoolId} ${subjectId} pre-assessment tutor. Verify and enrich these questions for a study app.

For EACH question:
1. Solve it carefully. Fix correctIndex or numeric answer if wrong.
2. Numeric questions: questionType "numeric", solution.steps (2-5 steps), finalAnswer, acceptedAnswers.
3. Multiple-choice: keep 4 options, provide distractors[] with misconception reasons.
4. Write learningObjective (one specific skill) and 2-5 tags.
5. Assign 1-2 topics from: ${topics.join(", ")}

${ENRICHMENT_PROMPT_RULES}

QUESTIONS:
${JSON.stringify(payload, null, 2)}`,
  });

  if (!output) throw new Error("Failed to enrich question chunk");
  return output.questions;
}

export interface EnrichQuestionBankResult {
  bank: QuestionBank;
  enrichedCount: number;
  skippedCount: number;
  removedCount: number;
}

export interface EnrichOptions {
  force?: boolean;
  onProgress?: (bank: QuestionBank) => void | Promise<void>;
}

export async function enrichQuestionBank(
  bank: QuestionBank,
  options?: EnrichOptions
): Promise<QuestionBank> {
  const result = await enrichQuestionBankDetailed(bank, options);
  return result.bank;
}

export async function enrichQuestionBankDetailed(
  bank: QuestionBank,
  options?: EnrichOptions
): Promise<EnrichQuestionBankResult> {
  const force = options?.force ?? false;
  const toEnrich = force
    ? bank.questions
    : getUnenrichedQuestions(bank.questions);
  const skippedCount = bank.questions.length - toEnrich.length;
  let removedCount = 0;

  if (toEnrich.length === 0) {
    const meta = bank.meta?.topicsCovered?.length
      ? bank.meta
      : await analyzeExamBlueprint(bank);
    const pruned = pruneIneligibleQuestions(bank.questions);

    return {
      bank: {
        ...bank,
        questions: pruned.kept,
        meta: {
          ...meta,
          lastEnrichedAt: bank.meta?.lastEnrichedAt ?? new Date().toISOString(),
          totalGenerated: meta.totalGenerated ?? 0,
        },
      },
      enrichedCount: 0,
      skippedCount,
      removedCount: pruned.removed.length,
    };
  }

  const meta = bank.meta?.topicsCovered?.length
    ? bank.meta
    : await analyzeExamBlueprint(bank);

  const enrichedById = new Map<string, Question | null>();

  for (let i = 0; i < toEnrich.length; i += CHUNK_SIZE) {
    const chunk = toEnrich.slice(i, i + CHUNK_SIZE);
    const results = await enrichQuestionChunk(
      chunk,
      bank.schoolId,
      bank.subjectId,
      meta.topicsCovered
    );

    for (const original of chunk) {
      const enriched = results.find((r) => r.id === original.id);
      if (!enriched) {
        enrichedById.set(original.id, original);
        continue;
      }
      const applied = applyAiEnrichment(original, enriched);
      if (!applied) {
        enrichedById.set(original.id, null);
        removedCount++;
      } else {
        enrichedById.set(original.id, applied);
      }
    }

    if (options?.onProgress) {
      const questions = bank.questions.flatMap((question) => {
        if (!force && isQuestionEnriched(question)) return [question];
        const next = enrichedById.get(question.id);
        if (next === null) return [];
        return [next ?? question];
      });
      await options.onProgress({
        ...bank,
        questions,
        meta: { ...meta, totalGenerated: meta.totalGenerated ?? 0 },
      });
    }
  }

  const questions = bank.questions.flatMap((question) => {
    if (!force && isQuestionEnriched(question)) return [question];
    const next = enrichedById.get(question.id);
    if (next === null) return [];
    return [next ?? question];
  });

  const pruned = pruneIneligibleQuestions(questions);
  removedCount += pruned.removed.length;

  return {
    bank: {
      ...bank,
      questions: pruned.kept,
      meta: {
        ...meta,
        lastEnrichedAt: new Date().toISOString(),
        totalGenerated: meta.totalGenerated ?? 0,
      },
    },
    enrichedCount: toEnrich.length - removedCount,
    skippedCount,
    removedCount,
  };
}
