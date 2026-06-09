import { enrichQuestionBank } from "@/lib/ai/enrich-bank";
import { generatePracticeQuestions } from "@/lib/ai/generate-questions";
import { extractQuestionsFromText, toQuestionBank } from "@/lib/ai-extract";
import { getQuestionBank, saveQuestionBank } from "@/lib/bank-loader";
import { getExamSpec } from "@/lib/exam-config";
import { findSubjectPdf } from "@/lib/find-subject-pdf";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import type { QuestionBank, SchoolId, SubjectId } from "@/types/exam";

export interface SubjectEnsureResult {
  subjectId: SubjectId;
  actions: string[];
  poolSize: number;
  examQuestionCount: number;
  skippedAi: boolean;
}

/**
 * Ensures a subject bank is ready before an exam.
 * Rules (cheap path first — AI only when needed):
 * - No bank → extract PDF, enrich, generate initial batch
 * - Not enriched → enrich once
 * - Pool < exam size → generate gap (+ small buffer)
 * - Every 5th exam start → light top-up if pool could grow
 * - Pool full & enriched → skip AI entirely
 */
export async function ensureSubjectBank(
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<SubjectEnsureResult> {
  const spec = getExamSpec(schoolId, subjectId);
  if (!spec) {
    throw new Error(`No exam spec for ${schoolId}/${subjectId}`);
  }

  const actions: string[] = [];
  let bank = await getQuestionBank(schoolId, subjectId);
  const examStarts = bank?.meta?.examStarts ?? 0;

  // ── 1. Bootstrap from PDF if empty ──
  if (!bank?.questions.length) {
    const pdfPath = await findSubjectPdf(schoolId, subjectId);
    if (!pdfPath) {
      throw new Error(
        `No question bank for ${subjectId}. Add a sample PDF to uploads/${schoolId}/${subjectId}/`
      );
    }

    actions.push("Reading sample PDF");
    const text = await extractTextFromPdf(pdfPath);
    actions.push("Extracting questions");
    const extraction = await extractQuestionsFromText(text, schoolId, subjectId);
    bank = toQuestionBank(extraction, schoolId, subjectId);
    bank.config = spec;
    await saveQuestionBank(bank);
  }

  bank.config = spec;
  let poolSize = bank.questions.length;
  const target = spec.questionCount;

  // ── 2. Fast path: pool is full enough and already enriched ──
  const isEnriched = Boolean(bank.meta?.lastEnrichedAt);
  const poolReady = poolSize >= target;

  if (isEnriched && poolReady) {
    // Light top-up every 5 exam starts to keep pool fresh
    if (examStarts > 0 && examStarts % 5 === 0 && poolSize < target * 2) {
      actions.push("Refreshing practice pool");
      bank = await generatePracticeQuestions(bank, 10);
      bank.config = spec;
      await saveQuestionBank(bank);
      poolSize = bank.questions.length;
    } else {
      actions.push("Using saved question bank");
    }

    await incrementExamStarts(bank);
    return {
      subjectId,
      actions,
      poolSize: bank.questions.length,
      examQuestionCount: target,
      skippedAi: actions.length === 1 && actions[0] === "Using saved question bank",
    };
  }

  // ── 3. Enrich if never done ──
  if (!isEnriched) {
    actions.push("Verifying answers & topics");
    bank = await enrichQuestionBank(bank);
    bank.config = spec;
    await saveQuestionBank(bank);
    poolSize = bank.questions.length;
  }

  // ── 4. Generate if pool below exam size ──
  if (poolSize < target) {
    const toGenerate = Math.min(Math.max(target - poolSize + 10, 10), 30);
    actions.push(`Generating ${toGenerate} practice questions`);
    bank = await generatePracticeQuestions(bank, toGenerate);
    bank.config = spec;
    await saveQuestionBank(bank);
    poolSize = bank.questions.length;
  }

  await incrementExamStarts(bank);

  return {
    subjectId,
    actions,
    poolSize,
    examQuestionCount: target,
    skippedAi: false,
  };
}

export async function ensureBanksForSubjects(
  schoolId: SchoolId,
  subjects: SubjectId[]
): Promise<SubjectEnsureResult[]> {
  const results: SubjectEnsureResult[] = [];
  for (const subjectId of subjects) {
    results.push(await ensureSubjectBank(schoolId, subjectId));
  }
  return results;
}

async function incrementExamStarts(bank: QuestionBank): Promise<void> {
  bank.meta = {
    topicsCovered: bank.meta?.topicsCovered ?? [],
    examBlueprint: bank.meta?.examBlueprint ?? [],
    schoolContext: bank.meta?.schoolContext,
    lastEnrichedAt: bank.meta?.lastEnrichedAt,
    lastGeneratedAt: bank.meta?.lastGeneratedAt,
    totalGenerated: bank.meta?.totalGenerated ?? 0,
    examStarts: (bank.meta?.examStarts ?? 0) + 1,
  };
  await saveQuestionBank(bank);
}
