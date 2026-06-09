import { enrichQuestionBank } from "@/lib/ai/enrich-bank";
import {
  countEnrichedQuestions,
  getUnenrichedQuestions,
  isQuestionEnriched,
} from "@/lib/question-enrichment";
import {
  type PreparePhase,
  updateSubjectPrepareProgress,
} from "@/lib/prepare-progress";
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
function report(
  jobId: string | undefined,
  subjectId: SubjectId,
  patch: {
    phase?: PreparePhase;
    poolSize?: number;
    target?: number;
    enrichedCount?: number;
    message?: string;
  }
) {
  if (!jobId) return;
  updateSubjectPrepareProgress(jobId, subjectId, patch);
}

export async function ensureSubjectBank(
  schoolId: SchoolId,
  subjectId: SubjectId,
  jobId?: string
): Promise<SubjectEnsureResult> {
  const spec = getExamSpec(schoolId, subjectId);
  if (!spec) {
    throw new Error(`No exam spec for ${schoolId}/${subjectId}`);
  }

  const actions: string[] = [];
  let bank = await getQuestionBank(schoolId, subjectId);
  const examStarts = bank?.meta?.examStarts ?? 0;
  const target = spec.questionCount;
  let poolSize = bank?.questions.length ?? 0;

  report(jobId, subjectId, {
    phase: "starting",
    poolSize,
    target,
    enrichedCount: countEnrichedQuestions(bank?.questions ?? []),
    message: poolSize > 0 ? "Checking question bank…" : "Starting preparation…",
  });

  // ── 1. Bootstrap from PDF if empty ──
  if (!bank?.questions.length) {
    const pdfPath = await findSubjectPdf(schoolId, subjectId);
    if (!pdfPath) {
      throw new Error(
        `No question bank for ${subjectId}. Add a sample PDF to uploads/${schoolId}/${subjectId}/`
      );
    }

    report(jobId, subjectId, {
      phase: "reading-pdf",
      poolSize: 0,
      target,
      message: "Reading sample PDF…",
    });
    const text = await extractTextFromPdf(pdfPath);
    report(jobId, subjectId, {
      phase: "extracting",
      message: "Extracting questions from PDF…",
    });
    actions.push("Reading sample PDF");
    actions.push("Extracting questions");
    const extraction = await extractQuestionsFromText(text, schoolId, subjectId);
    bank = toQuestionBank(extraction, schoolId, subjectId);
    bank.config = spec;
    await saveQuestionBank(bank);
    poolSize = bank.questions.length;
    report(jobId, subjectId, {
      poolSize,
      enrichedCount: countEnrichedQuestions(bank.questions),
      message: `Found ${poolSize} sample questions`,
    });
  }

  bank.config = spec;
  poolSize = bank.questions.length;

  // ── 2. Fast path: pool is full and every question has saved explanations ──
  const unenriched = getUnenrichedQuestions(bank.questions);
  const allEnriched = unenriched.length === 0 && bank.questions.every(isQuestionEnriched);
  const poolReady = poolSize >= target;

  if (allEnriched && poolReady) {
    // Light top-up every 5 exam starts to keep pool fresh
    if (examStarts > 0 && examStarts % 5 === 0 && poolSize < target * 2) {
      report(jobId, subjectId, {
        phase: "generating",
        poolSize,
        target,
        enrichedCount: countEnrichedQuestions(bank.questions),
        message: "Refreshing practice pool…",
      });
      actions.push("Refreshing practice pool");
      bank = await generatePracticeQuestions(bank, 10);
      bank.config = spec;
      const newUnenriched = getUnenrichedQuestions(bank.questions);
      if (newUnenriched.length > 0) {
        bank = await enrichQuestionBank(bank);
        bank.config = spec;
      }
      await saveQuestionBank(bank);
      poolSize = bank.questions.length;
    } else {
      actions.push("Using saved question bank");
      report(jobId, subjectId, {
        phase: "done",
        poolSize: Math.min(poolSize, target),
        target,
        enrichedCount: countEnrichedQuestions(bank.questions),
        message: "Using saved question bank",
      });
    }

    report(jobId, subjectId, {
      phase: "done",
      poolSize: Math.min(poolSize, target),
      target,
      enrichedCount: countEnrichedQuestions(bank.questions),
      message: "Ready",
    });

    await incrementExamStarts(bank);
    return {
      subjectId,
      actions,
      poolSize: bank.questions.length,
      examQuestionCount: target,
      skippedAi: actions.length === 1 && actions[0] === "Using saved question bank",
    };
  }

  const persistBank = async (next: QuestionBank, phase?: PreparePhase) => {
    next.config = spec;
    await saveQuestionBank(next);
    bank = next;
    poolSize = bank.questions.length;
    report(jobId, subjectId, {
      phase,
      poolSize,
      target,
      enrichedCount: countEnrichedQuestions(bank.questions),
      message:
        phase === "enriching"
          ? `Adding explanations (${countEnrichedQuestions(bank.questions)}/${poolSize})`
          : phase === "generating"
            ? `Building question pool (${Math.min(poolSize, target)}/${target})`
            : undefined,
    });
  };

  // ── 3. Enrich only questions still missing explanations (skip saved ones) ──
  if (unenriched.length > 0) {
    report(jobId, subjectId, {
      phase: "enriching",
      poolSize,
      target,
      enrichedCount: countEnrichedQuestions(bank.questions),
      message: `Adding explanations (0/${poolSize})`,
    });
    actions.push(
      unenriched.length === bank.questions.length
        ? "Verifying answers & topics"
        : `Adding explanations for ${unenriched.length} new questions`
    );
    bank = await enrichQuestionBank(bank, {
      onProgress: async (next) => persistBank(next, "enriching"),
    });
    await persistBank(bank, "enriching");
  }

  // ── 4. Generate in small batches until pool reaches exam size ──
  const GENERATE_BATCH = 5;
  let generateRounds = 0;
  while (poolSize < target && generateRounds < 30) {
    const batchSize = Math.min(GENERATE_BATCH, target - poolSize);
    const before = poolSize;
    report(jobId, subjectId, {
      phase: "generating",
      poolSize,
      target,
      enrichedCount: countEnrichedQuestions(bank.questions),
      message: `Generating questions (${poolSize}/${target})`,
    });
    actions.push(`Generating questions (${poolSize}/${target})`);
    bank = await generatePracticeQuestions(bank, batchSize);
    await persistBank(bank, "generating");
    generateRounds++;
    if (poolSize === before) break;
  }

  const stillUnenriched = getUnenrichedQuestions(bank.questions);
  if (stillUnenriched.length > 0) {
    report(jobId, subjectId, {
      phase: "enriching",
      message: `Saving explanations for new questions`,
    });
    actions.push(`Saving explanations for ${stillUnenriched.length} questions`);
    bank = await enrichQuestionBank(bank, {
      onProgress: async (next) => persistBank(next, "enriching"),
    });
    await persistBank(bank, "finishing");
  }

  report(jobId, subjectId, {
    phase: "done",
    poolSize: Math.min(poolSize, target),
    target,
    enrichedCount: countEnrichedQuestions(bank.questions),
    message: "Ready",
  });

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
  subjects: SubjectId[],
  jobId?: string
): Promise<SubjectEnsureResult[]> {
  const results: SubjectEnsureResult[] = [];
  for (const subjectId of subjects) {
    results.push(await ensureSubjectBank(schoolId, subjectId, jobId));
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
