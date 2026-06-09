import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";
import {
  getUnenrichedQuestions,
  isQuestionEnriched,
} from "@/lib/question-enrichment";
import type { BankMeta, Question, QuestionBank, SchoolId, SubjectId } from "@/types/exam";

const CHUNK_SIZE = 8;

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
  questions: z.array(
    z.object({
      id: z.string(),
      correctIndex: z.number().int(),
      answerConfidence: z.enum(["high", "medium", "low"]),
      explanation: z.string(),
      wrongAnswerHints: z.array(
        z.object({
          optionIndex: z.number().int(),
          hint: z.string(),
        })
      ),
      topics: z.array(z.string()),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
});

export async function analyzeExamBlueprint(
  bank: QuestionBank
): Promise<BankMeta> {
  const sample = bank.questions
    .slice(0, 15)
    .map((q, i) => `${i + 1}. ${q.text}\n   Options: ${q.options.join(" | ")}`)
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
  const payload = questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    currentCorrectIndex: q.correctIndex,
  }));

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: enrichChunkSchema }),
    prompt: `You are a ${schoolId} ${subjectId} pre-assessment tutor. Verify and enrich these MCQ questions.

For EACH question:
1. Solve it. Set correctIndex (0-based). Flag answerConfidence.
2. Write a clear explanation (2-3 sentences) for the correct answer.
3. For EACH wrong option, write a short wrongAnswerHints entry explaining why it's wrong.
4. Assign 1-2 topics from: ${topics.join(", ")}
5. Set difficulty: easy | medium | hard

Be accurate. If currentCorrectIndex is wrong, fix it.

QUESTIONS:
${JSON.stringify(payload, null, 2)}`,
  });

  if (!output) throw new Error("Failed to enrich question chunk");
  return output.questions;
}

function applyEnrichmentResult(
  original: Question,
  enriched: z.infer<typeof enrichChunkSchema>["questions"][number]
): Question {
  const wrongAnswerHints: Record<string, string> = {};
  for (const hint of enriched.wrongAnswerHints) {
    if (hint.optionIndex !== enriched.correctIndex) {
      wrongAnswerHints[String(hint.optionIndex)] = hint.hint;
    }
  }

  return {
    ...original,
    correctIndex: enriched.correctIndex,
    explanation: enriched.explanation,
    wrongAnswerHints,
    meta: {
      topics: enriched.topics,
      difficulty: enriched.difficulty,
      source: original.meta?.source === "generated" ? "generated" : "verified",
      verifiedAt: new Date().toISOString(),
      answerConfidence: enriched.answerConfidence,
    },
  };
}

export interface EnrichQuestionBankResult {
  bank: QuestionBank;
  enrichedCount: number;
  skippedCount: number;
}

/** Enrich only questions missing explanations — saved banks skip repeat AI calls */
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

  if (toEnrich.length === 0) {
    const meta = bank.meta?.topicsCovered?.length
      ? bank.meta
      : await analyzeExamBlueprint(bank);

    return {
      bank: {
        ...bank,
        meta: {
          ...meta,
          lastEnrichedAt: bank.meta?.lastEnrichedAt ?? new Date().toISOString(),
          totalGenerated: meta.totalGenerated ?? 0,
        },
      },
      enrichedCount: 0,
      skippedCount,
    };
  }

  const meta = bank.meta?.topicsCovered?.length
    ? bank.meta
    : await analyzeExamBlueprint(bank);

  const enrichedById = new Map<string, Question>();

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
      enrichedById.set(original.id, applyEnrichmentResult(original, enriched));
    }

    if (options?.onProgress) {
      const questions = bank.questions.map((question) => {
        if (!force && isQuestionEnriched(question)) return question;
        return enrichedById.get(question.id) ?? question;
      });
      await options.onProgress({
        ...bank,
        questions,
        meta: {
          ...meta,
          totalGenerated: meta.totalGenerated ?? 0,
        },
      });
    }
  }

  const questions = bank.questions.map((question) => {
    if (!force && isQuestionEnriched(question)) return question;
    return enrichedById.get(question.id) ?? question;
  });

  return {
    bank: {
      ...bank,
      questions,
      meta: {
        ...meta,
        lastEnrichedAt: new Date().toISOString(),
        totalGenerated: meta.totalGenerated ?? 0,
      },
    },
    enrichedCount: toEnrich.length,
    skippedCount,
  };
}
