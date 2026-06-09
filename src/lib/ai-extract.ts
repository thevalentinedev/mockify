import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";
import type {
  Question,
  QuestionBank,
  QuestionContext,
  SchoolId,
  SubjectId,
} from "@/types/exam";

const contextSchema = z.object({
  id: z.string(),
  type: z.enum(["passage", "comprehension", "graph", "table", "diagram", "image"]),
  title: z.string().nullable(),
  content: z.string(),
});

const extractionSchema = z.object({
  config: z.object({
    questionCount: z.number().int().positive(),
    timeLimitMinutes: z.number().int().positive().nullable(),
  }),
  contexts: z.array(contextSchema).nullable(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      options: z.array(z.string()).min(2),
      correctIndex: z.number().int().nullable(),
      explanation: z.string().nullable(),
      contextId: z.string().nullable(),
    })
  ),
  notes: z.string().nullable(),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

export async function extractQuestionsFromText(
  text: string,
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<ExtractionResult> {
  const { output } = await generateText({
    model: openai(AI_MODEL),
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
- Skip instructions and page headers only — passages, graphs, tables, and diagrams are NOT non-question content; extract their full text/data into contexts[] instead of omitting them.
- If options are labeled A/B/C/D, strip the letter prefix from option text.
- When a passage, graph, table, or diagram is shared by one or more questions, add the full content to contexts[] with a unique id (e.g. ctx-1, fig-1).
- Link every question that refers to shared material — e.g. "the passage", "the story", "according to the graph", "the table above", "Figure 1" — via contextId pointing to the matching context.
- Reuse the same contextId for all questions that share the same passage, graph, or table.
- For passages and tables with extractable text/data, put the full text in context content.
- For diagrams, graphs, and images that are NOT present as text in the PDF extract, still create a context entry:
  - type: "diagram" | "graph" | "image" as appropriate
  - title: the figure label exactly as in the PDF (e.g. "Figure 1", "Figure 2")
  - content: a short placeholder such as "The actual diagram is not included in the extracted text." — images will be attached from the PDF later
- Do NOT skip figure/diagram contexts just because the visual is missing from the text; questions referencing "Figure N" must have a linked context with that title.

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
  const contexts: Record<string, QuestionContext> = {};
  for (const ctx of extraction.contexts ?? []) {
    contexts[ctx.id] = {
      id: ctx.id,
      type: ctx.type,
      title: ctx.title ?? undefined,
      content: ctx.content,
    };
  }

  const questions: Question[] = extraction.questions.map((q, index) => ({
    id: q.id || `${subjectId.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex ?? 0,
    explanation: q.explanation ?? undefined,
    contextId: q.contextId ?? undefined,
    meta: { topics: [], source: "sample" as const },
  }));

  return {
    schoolId,
    subjectId,
    contexts: Object.keys(contexts).length > 0 ? contexts : undefined,
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
