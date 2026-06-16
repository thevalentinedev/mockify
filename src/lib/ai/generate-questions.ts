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
import type { Question, QuestionBank, QuestionContext } from "@/types/exam";

const contextSchema = z.object({
  id: z.string(),
  type: z.enum(["passage", "comprehension", "graph", "table", "diagram", "image"]),
  title: z.string().nullable(),
  content: z.string(),
});

const generateSchema = z.object({
  contexts: z.array(contextSchema).nullable(),
  questions: z.array(aiGeneratedQuestionSchema),
});

function nextUniqueContextKey(
  existing: Record<string, QuestionContext>,
  startId: number,
  index: number
): string {
  let key = `gen-ctx-${startId}-${index}`;
  let suffix = 0;
  while (existing[key]) {
    suffix++;
    key = `gen-ctx-${startId}-${index}-${suffix}`;
  }
  return key;
}

function formatContextLinkedSamples(bank: QuestionBank): string {
  if (!bank.contexts || Object.keys(bank.contexts).length === 0) {
    return "";
  }

  const linked = bank.questions
    .filter((q) => q.contextId && bank.contexts?.[q.contextId])
    .slice(0, 2);

  if (linked.length === 0) return "";

  return linked
    .map((q) => {
      const ctx = bank.contexts![q.contextId!];
      const preview =
        ctx.content.length > 400
          ? `${ctx.content.slice(0, 400)}…`
          : ctx.content;
      const numeric = isTextGradedQuestion(q);
      return `Context-linked example (contextId: ${q.contextId}, type: ${ctx.type}):
Context excerpt: ${preview}
Q: ${q.text}
${numeric ? `Answer: ${q.answer}` : `Options: ${(q.options ?? []).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}`}`;
    })
    .join("\n\n");
}

export async function generatePracticeQuestions(
  bank: QuestionBank,
  count: number
): Promise<QuestionBank> {
  if (!bank.meta?.topicsCovered?.length) {
    throw new Error("Question bank needs topic analysis before generating.");
  }

  const samples = bank.questions
    .filter((q) => q.meta?.source !== "generated")
    .slice(0, 6)
    .map((q) => {
      const numeric = isTextGradedQuestion(q);
      if (numeric) {
        return `Q: ${q.text}\nType: numeric\nAnswer: ${q.answer}\nTopic: ${q.meta?.topics?.join(", ") ?? "general"}`;
      }
      return `Q: ${q.text}\nOptions: ${(q.options ?? []).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}\nTopic: ${q.meta?.topics?.join(", ") ?? "general"}`;
    })
    .join("\n\n");

  const contextSamples = formatContextLinkedSamples(bank);
  const topicList = bank.meta.examBlueprint
    .map((t) => `${t.topic} (~${t.weight}% of exam)`)
    .join(", ");

  const numericHeavy = bank.subjectId === "maths";

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: generateSchema }),
    prompt: `Generate ${count} NEW practice questions for ${bank.schoolId} ${bank.subjectId} pre-assessment.

Context: ${bank.meta.schoolContext ?? "College entrance pre-assessment"}

Topics to cover (distribute evenly): ${topicList}

Match the STYLE and DIFFICULTY of these sample questions:

${samples}
${contextSamples ? `\nContext-linked examples:\n\n${contextSamples}\n` : ""}

Rules:
- ${numericHeavy ? "For maths: prefer questionType numeric with answer, acceptedAnswers, and solution.steps. Only use multiple_choice when the source style requires A/B/C/D from a figure." : "Use multiple_choice with exactly 4 options unless the subject clearly needs short numeric answers."}
- Questions must be original, not paraphrases of samples
- Include solution.steps, distractors (for MCQ), learningObjective, and tags
- Shared passages/graphs go in contexts[] with contextId on questions
- Only return answerConfidence "high" when fully certain — medium/low questions are discarded

${ENRICHMENT_PROMPT_RULES}`,
  });

  if (!output?.questions.length) {
    throw new Error("AI generated no questions");
  }

  const prefix = bank.subjectId.slice(0, 4);
  const startId = bank.questions.length + 1;

  const existingContexts: Record<string, QuestionContext> = {
    ...bank.contexts,
  };
  const contextIdMap = new Map<string, string>();

  for (const [i, ctx] of (output.contexts ?? []).entries()) {
    const uniqueKey = nextUniqueContextKey(existingContexts, startId, i);
    contextIdMap.set(ctx.id, uniqueKey);
    existingContexts[uniqueKey] = {
      id: uniqueKey,
      type: ctx.type,
      title: ctx.title ?? undefined,
      content: ctx.content,
    };
  }

  const newQuestions: Question[] = [];

  for (const [i, q] of output.questions.entries()) {
    const id = `${prefix}-gen-${String(startId + i).padStart(3, "0")}`;
    const remappedContextId = q.contextId
      ? (contextIdMap.get(q.contextId) ?? q.contextId)
      : undefined;

    const applied = applyAiGeneratedQuestion(
      {
        id,
        text: q.text,
        options: q.options ?? undefined,
        contextId: remappedContextId,
        meta: { topics: q.topics, source: "generated" },
      },
      q
    );

    if (applied) newQuestions.push(applied);
  }

  const merged = mergeQuestions(bank.questions, newQuestions);

  return {
    ...bank,
    questions: merged,
    contexts:
      Object.keys(existingContexts).length > 0 ? existingContexts : bank.contexts,
    meta: {
      ...bank.meta,
      topicsCovered: bank.meta.topicsCovered,
      examBlueprint: bank.meta.examBlueprint,
      lastGeneratedAt: new Date().toISOString(),
      totalGenerated: (bank.meta.totalGenerated ?? 0) + newQuestions.length,
    },
  };
}
