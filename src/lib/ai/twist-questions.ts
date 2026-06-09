import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";
import { mergeQuestions } from "@/lib/ai/merge-questions";
import type { Question, QuestionBank } from "@/types/exam";

const twistSchema = z.object({
  questions: z.array(
    z.object({
      sourceId: z.string(),
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
    .map(
      (q, i) =>
        `[${i}] id=${q.id}
Q: ${q.text}
Options: ${q.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join(" | ")}
Correct: ${String.fromCharCode(65 + q.correctIndex)}
Topic: ${q.meta?.topics?.join(", ") ?? "general"}`
    )
    .join("\n\n");

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: twistSchema }),
    prompt: `Create ${toTwist.length} NEW variations of these ${bank.schoolId} ${bank.subjectId} multiple-choice questions.

Each variation must test the SAME skill/topic but feel like a different question:
- Change names, numbers, scenarios, and wording substantially
- Do NOT copy the stem verbatim — students should not recognize it from memory
- Keep the same difficulty and academic level
- Exactly 4 options per question (no letter prefixes in option text)
- Include explanation and wrongAnswerHints for each wrong option
- Return sourceId matching the id from the input

Source questions:

${samples}

Rules:
- Output one twisted question per sourceId listed above
- Options must be plausible; correct answer must remain logically correct for the new scenario
- Assign the same topics as the source where possible`,
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

    const wrongAnswerHints: Record<string, string> = {};
    for (const hint of q.wrongAnswerHints) {
      if (hint.optionIndex !== q.correctIndex) {
        wrongAnswerHints[String(hint.optionIndex)] = hint.hint;
      }
    }

    newQuestions.push({
      id: `${prefix}-var-${String(startId + i).padStart(3, "0")}`,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      wrongAnswerHints,
      contextId: source.contextId,
      meta: {
        topics: q.topics.length ? q.topics : (source.meta?.topics ?? ["general"]),
        difficulty: q.difficulty,
        source: "variant",
        verifiedAt: new Date().toISOString(),
        answerConfidence: "high",
      },
    });
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
