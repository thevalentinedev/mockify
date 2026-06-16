import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  ENRICHMENT_PROMPT_RULES,
  aiGeneratedQuestionSchema,
  applyAiGeneratedQuestion,
} from "@/lib/ai/question-schema";
import { AI_MODEL } from "@/lib/ai/model";
import { mergeQuestions } from "@/lib/ai/merge-questions";
import { isTextGradedQuestion } from "@/lib/question-type";
import type { Question, QuestionBank } from "@/types/exam";

const twistSchema = z.object({
  questions: z.array(
    aiGeneratedQuestionSchema.extend({
      sourceId: z.string(),
    })
  ),
});

export async function twistPracticeQuestions(
  bank: QuestionBank,
  sourceQuestions: Question[],
  count: number
): Promise<QuestionBank> {
  if (!sourceQuestions.length) return bank;

  const toTwist = sourceQuestions.slice(0, count);
  const samples = toTwist
    .map((q, i) => {
      const numeric = isTextGradedQuestion(q);
      return `[${i}] sourceId=${q.id}
Q: ${q.text}
${numeric ? `Type: numeric\nAnswer: ${q.answer}` : `Options: ${(q.options ?? []).map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join(" | ")}\nCorrect: ${String.fromCharCode(65 + (q.correctIndex ?? 0))}`}
Topic: ${q.meta?.topics?.join(", ") ?? "general"}`;
    })
    .join("\n\n");

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: twistSchema }),
    prompt: `Create ${toTwist.length} NEW variations of these ${bank.schoolId} ${bank.subjectId} questions.

Each variation must test the SAME skill/topic but feel like a different question:
- Change names, numbers, scenarios, and wording substantially
- Keep the same questionType as the source (numeric stays numeric, MCQ stays MCQ)
- Include solution.steps, distractors (for MCQ), learningObjective, and tags
- Return sourceId matching the input id

Source questions:

${samples}

${ENRICHMENT_PROMPT_RULES}`,
  });

  if (!output?.questions.length) {
    throw new Error("AI produced no question variations");
  }

  const prefix = bank.subjectId.slice(0, 4);
  const startId = bank.questions.length + 1;
  const newQuestions: Question[] = [];

  for (const [i, q] of output.questions.entries()) {
    const source = toTwist.find((s) => s.id === q.sourceId) ?? toTwist[i];
    if (!source) continue;

    const applied = applyAiGeneratedQuestion(
      {
        id: `${prefix}-var-${String(startId + i).padStart(3, "0")}`,
        text: q.text,
        options: q.options ?? source.options,
        contextId: source.contextId,
        questionType: source.questionType,
        meta: {
          topics: q.topics.length ? q.topics : (source.meta?.topics ?? ["general"]),
          source: "variant",
        },
      },
      q
    );

    if (applied) newQuestions.push(applied);
  }

  const merged = mergeQuestions(bank.questions, newQuestions);

  return {
    ...bank,
    questions: merged,
    meta: {
      ...bank.meta,
      topicsCovered: bank.meta?.topicsCovered ?? [],
      examBlueprint: bank.meta?.examBlueprint ?? [],
      lastTwistedAt: new Date().toISOString(),
      totalGenerated: (bank.meta?.totalGenerated ?? 0) + newQuestions.length,
    },
  };
}
