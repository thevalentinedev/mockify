import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";
import { mergeQuestions } from "@/lib/ai/merge-questions";
import type { Question, QuestionBank, QuestionContext } from "@/types/exam";

const contextSchema = z.object({
  id: z.string(),
  type: z.enum(["passage", "comprehension", "graph", "table", "diagram", "image"]),
  title: z.string().nullable(),
  content: z.string(),
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

  if (linked.length === 0) {
    return "";
  }

  return linked
    .map((q) => {
      const ctx = bank.contexts![q.contextId!];
      const preview =
        ctx.content.length > 400
          ? `${ctx.content.slice(0, 400)}…`
          : ctx.content;
      return `Context-linked example (contextId: ${q.contextId}, type: ${ctx.type}):
Context excerpt: ${preview}
Q: ${q.text}
Options: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}`;
    })
    .join("\n\n");
}

const generateSchema = z.object({
  contexts: z.array(contextSchema).nullable(),
  questions: z.array(
    z.object({
      text: z.string(),
      options: z.array(z.string()).min(4).max(4),
      correctIndex: z.number().int(),
      explanation: z.string(),
      wrongAnswerHints: z.array(
        z.object({
          optionIndex: z.number().int(),
          hint: z.string(),
        })
      ),
      topics: z.array(z.string()),
      difficulty: z.enum(["easy", "medium", "hard"]),
      contextId: z.string().nullable(),
    })
  ),
});

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
    .map(
      (q) =>
        `Q: ${q.text}\nOptions: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}\nTopic: ${q.meta?.topics?.join(", ") ?? "general"}`
    )
    .join("\n\n");

  const contextSamples = formatContextLinkedSamples(bank);

  const topicList = bank.meta.examBlueprint
    .map((t) => `${t.topic} (~${t.weight}% of exam)`)
    .join(", ");

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: generateSchema }),
    prompt: `Generate ${count} NEW multiple-choice practice questions for ${bank.schoolId} ${bank.subjectId} pre-assessment.

Context: ${bank.meta.schoolContext ?? "College entrance pre-assessment"}

Topics to cover (distribute evenly): ${topicList}

Match the STYLE and DIFFICULTY of these sample questions — samples show what topics appear, not exact wording to copy:

${samples}
${contextSamples ? `\nThese passage/graph-linked examples show how contextId ties questions to shared material:\n\n${contextSamples}\n` : ""}
Rules:
- Exactly 4 options per question (A-D style content, no letter prefixes)
- Questions must be original, not paraphrases of samples
- Same academic level as samples
- Include explanation and wrongAnswerHints for each wrong option
- Assign topics and difficulty
- Any question that refers to "the passage", "the story", "the graph", "the table", "the diagram", or similar shared material MUST include the full passage or data in contexts[] and set contextId on that question
- When multiple questions share one passage or graph, reuse the same contextId across those questions
- contextId values in your output are logical labels only — they will be remapped when saved; use short unique ids within your response (e.g. ctx-1, ctx-2)
- Focus on mastery — questions should prepare students to score 100%`,
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

  const newQuestions: Question[] = output.questions.map((q, i) => {
    const wrongAnswerHints: Record<string, string> = {};
    for (const hint of q.wrongAnswerHints) {
      if (hint.optionIndex !== q.correctIndex) {
        wrongAnswerHints[String(hint.optionIndex)] = hint.hint;
      }
    }

    const remappedContextId = q.contextId
      ? (contextIdMap.get(q.contextId) ?? q.contextId)
      : undefined;

    return {
      id: `${prefix}-gen-${String(startId + i).padStart(3, "0")}`,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      wrongAnswerHints,
      contextId: remappedContextId,
      meta: {
        topics: q.topics,
        difficulty: q.difficulty,
        source: "generated",
        verifiedAt: new Date().toISOString(),
        answerConfidence: "high",
      },
    };
  });

  const mergedContexts = existingContexts;

  const merged = mergeQuestions(bank.questions, newQuestions);

  return {
    ...bank,
    questions: merged,
    contexts: Object.keys(mergedContexts).length > 0 ? mergedContexts : bank.contexts,
    meta: {
      ...bank.meta,
      topicsCovered: bank.meta.topicsCovered,
      examBlueprint: bank.meta.examBlueprint,
      lastGeneratedAt: new Date().toISOString(),
      totalGenerated: (bank.meta.totalGenerated ?? 0) + newQuestions.length,
    },
  };
}
