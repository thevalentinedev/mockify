import { getQuestionBank, saveQuestionBank } from "@/lib/bank-loader";
import { ensureContextImagesPersisted } from "@/lib/blob-assets";
import {
  getExamSpec,
  getModeQuestionCount,
  getModeTimeLimitMinutes,
} from "@/lib/exam-config";
import { recordExamQuestionUsage } from "@/lib/exam-variety";
import { getContextKey, resolveQuestionContext } from "@/lib/question-context";
import { selectQuestionsWithBias } from "@/lib/spaced-selection";
import { remapWrongAnswerHints, shuffleQuestionOptions } from "@/lib/shuffle";
import type {
  ExamBuildPreferences,
  ExamCustomOptions,
  ExamMode,
  ExamSession,
  SchoolId,
  ShuffledQuestion,
  SubjectCustomOptions,
  SubjectId,
  SubjectSection,
} from "@/types/exam";

export interface ExamBuildOptions extends ExamBuildPreferences {
  customQuestionCount?: number;
  customTimeLimitMinutes?: number;
  wrongQuestionIdsBySubject?: Partial<Record<SubjectId, string[]>>;
}

function resolveCustomForSubject(
  subjectId: SubjectId,
  options?: ExamBuildOptions
): SubjectCustomOptions | undefined {
  const per = options?.customPerSubject?.[subjectId];
  if (per) return per;
  if (options?.customQuestionCount !== undefined) {
    return {
      questionCount: options.customQuestionCount,
      timeLimitMinutes: options.customTimeLimitMinutes ?? 0,
    };
  }
  return undefined;
}

export async function buildExamSession(
  schoolId: SchoolId,
  subjects: SubjectId[],
  mode: ExamMode,
  options?: ExamBuildOptions
): Promise<ExamSession | null> {
  const startedAt = Date.now();
  const sections: SubjectSection[] = [];

  const customOptions: ExamCustomOptions | undefined =
    mode === "custom" && options?.customPerSubject
      ? { perSubject: options.customPerSubject }
      : undefined;

  for (const subjectId of subjects) {
    let bank = await getQuestionBank(schoolId, subjectId);
    if (!bank?.questions.length) continue;

    bank = await ensureContextImagesPersisted(bank);

    const spec = getExamSpec(schoolId, subjectId);
    const baseSpec = spec ?? bank.config;
    const customForSubject = resolveCustomForSubject(subjectId, options);

    const examCount = getModeQuestionCount(mode, baseSpec, {
      customQuestionCount: customForSubject?.questionCount,
    });

    const sectionQuestions: ShuffledQuestion[] = [];

    const selected = selectQuestionsWithBias(
      bank.questions,
      Math.min(examCount, bank.questions.length),
      {
        recentSets: bank.meta?.recentExamSets ?? [],
        wrongQuestionIds: options?.wrongQuestionIdsBySubject?.[subjectId],
        focusTopics: options?.focusTopics,
      }
    );

    bank = recordExamQuestionUsage(
      bank,
      selected.map((q) => q.id)
    );
    await saveQuestionBank(bank);

    for (const question of selected) {
      const shuffledOptions = shuffleQuestionOptions(
        question.options,
        question.correctIndex
      );

      const wrongHints = question.wrongAnswerHints
        ? remapWrongAnswerHints(
            question.wrongAnswerHints,
            shuffledOptions.indexMap,
            shuffledOptions.correctIndex
          )
        : undefined;

      const context = resolveQuestionContext(question, bank.contexts);
      sectionQuestions.push({
        id: `${subjectId}-${question.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        originalId: question.id,
        subjectId,
        text: question.text,
        options: shuffledOptions.options,
        correctIndex: shuffledOptions.correctIndex,
        explanation: question.explanation,
        wrongAnswerHints: wrongHints,
        topic: question.meta?.topics?.[0],
        answerConfidence: question.meta?.answerConfidence,
        context,
        contextKey: context ? getContextKey(context, question.id) : undefined,
      });
    }

    if (sectionQuestions.length === 0) continue;

    sections.push({
      subjectId,
      questions: sectionQuestions,
      timeLimitMinutes: getModeTimeLimitMinutes(mode, baseSpec, {
        customTimeLimitMinutes: customForSubject?.timeLimitMinutes,
      }),
      startedAt: sections.length === 0 ? startedAt : 0,
    });
  }

  if (sections.length === 0) return null;

  return {
    schoolId,
    subjects: sections.map((s) => s.subjectId),
    mode,
    sections,
    startedAt,
    ...(customOptions ? { customOptions } : {}),
    ...(options?.focusTopics?.length ? { focusTopics: options.focusTopics } : {}),
  };
}

export async function getSessionStats(
  schoolId: SchoolId,
  subjects: SubjectId[],
  mode: ExamMode,
  options?: ExamBuildOptions
) {
  let totalQuestions = 0;
  let totalTimeMinutes = 0;
  const bySubject = [];

  for (const subjectId of subjects) {
    const spec = getExamSpec(schoolId, subjectId);
    const bank = await getQuestionBank(schoolId, subjectId);
    const baseSpec = spec ?? bank?.config ?? { questionCount: 0, timeLimitMinutes: 0 };
    const customForSubject = resolveCustomForSubject(subjectId, options);

    const examCount = getModeQuestionCount(mode, baseSpec, {
      customQuestionCount: customForSubject?.questionCount,
    });
    const effectiveCount = Math.min(examCount, bank?.questions.length ?? 0);
    const timeLimit =
      getModeTimeLimitMinutes(mode, baseSpec, {
        customTimeLimitMinutes: customForSubject?.timeLimitMinutes,
      }) ?? 0;
    const poolSize = bank?.questions.length ?? 0;
    const maxQuestions = Math.min(poolSize, baseSpec.questionCount);

    totalQuestions += effectiveCount;
    totalTimeMinutes += timeLimit;
    bySubject.push({
      subjectId,
      questionCount: effectiveCount,
      requestedCount: examCount,
      maxQuestions,
      poolSize,
      timeLimitMinutes: timeLimit,
      ready: poolSize > 0,
      poolComplete: poolSize >= examCount,
    });
  }

  return {
    totalQuestions,
    totalTimeMinutes,
    bySubject,
    mode,
    timed: totalTimeMinutes > 0,
  };
}
