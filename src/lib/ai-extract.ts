import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Question, QuestionBank, SchoolId, SubjectId } from "@/types/exam";

const extractionSchema = z.object({
  config: z.object({
    questionCount: z.number().int().positive(),
    timeLimitMinutes: z.number().int().positive().nullable(),
  }),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      options: z.array(z.string()).min(2),
      correctIndex: z.number().int().nullable(),
      explanation: z.string().nullable(),
    })
  ),
  notes: z.string().nullable(),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

const MODEL = "gpt-4o-mini";

export async function extractQuestionsFromText(
  text: string,
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<ExtractionResult> {
  const { output } = await generateText({
    model: openai(MODEL),
    output: Output.object({ schema: extractionSchema }),
    prompt: `You are parsing a pre-assessment exam PDF for ${schoolId} college, subject: ${subjectId}.

Extract every multiple-choice question from the text below.

Rules:
- Each question must have the full question text and all answer options (usually A–D).
- Assign ids like "${subjectId.slice(0, 4)}-001", "${subjectId.slice(0, 4)}-002", etc.
- If an answer key is present, set correctIndex (0-based). If answers are missing, set correctIndex to null.
- config.questionCount = total number of questions extracted.
- config.timeLimitMinutes = time limit in minutes if stated in the document, otherwise null.
- Preserve wording exactly as in the source where possible.
- Skip instructions, headers, and non-question content.
- If options are labeled A/B/C/D, strip the letter prefix from option text.

PDF TEXT:
${text}`,
  });

  if (!output) {
    throw new Error("AI failed to extract structured questions from the PDF.");
  }

  return output;
}

export function toQuestionBank(
  extraction: ExtractionResult,
  schoolId: SchoolId,
  subjectId: SubjectId,
  overrides?: { questionCount?: number; timeLimitMinutes?: number }
): QuestionBank {
  const questions: Question[] = extraction.questions.map((q, index) => ({
    id: q.id || `${subjectId.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex ?? 0,
    explanation: q.explanation ?? undefined,
    meta: { topics: [], source: "sample" as const },
  }));

  return {
    schoolId,
    subjectId,
    config: {
      // Real exam size = questions found in the PDF sample
      questionCount: overrides?.questionCount ?? extraction.questions.length,
      timeLimitMinutes:
        overrides?.timeLimitMinutes ??
        extraction.config.timeLimitMinutes ??
        30,
    },
    questions,
  };
}
