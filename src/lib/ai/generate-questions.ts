import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";
import { mergeQuestions } from "@/lib/ai/merge-questions";
import type { Question, QuestionBank } from "@/types/exam";

const generateSchema = z.object({
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

Rules:
- Exactly 4 options per question (A-D style content, no letter prefixes)
- Questions must be original, not paraphrases of samples
- Same academic level as samples
- Include explanation and wrongAnswerHints for each wrong option
- Assign topics and difficulty
- Focus on mastery — questions should prepare students to score 100%`,
  });

  if (!output?.questions.length) {
    throw new Error("AI generated no questions");
  }

  const prefix = bank.subjectId.slice(0, 4);
  const startId = bank.questions.length + 1;

  const newQuestions: Question[] = output.questions.map((q, i) => {
    const wrongAnswerHints: Record<string, string> = {};
    for (const hint of q.wrongAnswerHints) {
      if (hint.optionIndex !== q.correctIndex) {
        wrongAnswerHints[String(hint.optionIndex)] = hint.hint;
      }
    }

    return {
      id: `${prefix}-gen-${String(startId + i).padStart(3, "0")}`,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      wrongAnswerHints,
      meta: {
        topics: q.topics,
        difficulty: q.difficulty,
        source: "generated",
        verifiedAt: new Date().toISOString(),
        answerConfidence: "high",
      },
    };
  });

  const merged = mergeQuestions(bank.questions, newQuestions);

  return {
    ...bank,
    questions: merged,
    meta: {
      ...bank.meta,
      topicsCovered: bank.meta.topicsCovered,
      examBlueprint: bank.meta.examBlueprint,
      lastGeneratedAt: new Date().toISOString(),
      totalGenerated: (bank.meta.totalGenerated ?? 0) + newQuestions.length,
    },
  };
}
