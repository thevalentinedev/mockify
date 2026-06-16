import { isTextGradedQuestion } from "@/lib/answer-grader";
import {
  filterMathsPoolForProgram,
  getMathsProgramLimit,
  getMathsScaledTimeLimit,
  resolveMathsQuestionCount,
  usesSequentialMathsOrder,
} from "@/lib/maths-program";
import { filterExamEligibleQuestions } from "@/lib/question-eligibility";
import { collectStudyTopics, filterQuestionsByStudyTopics } from "@/lib/question-topics";
import { getLearningObjective, getTopicLabel } from "@/lib/learning-objective";
import { getQuestionTags } from "@/lib/tags";
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
  Question,
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

function resolveSubjectQuestionPool(
  schoolId: SchoolId,
  subjectId: SubjectId,
  questions: Question[],
  options?: ExamBuildOptions
) {
  if (
    schoolId === "conestoga" &&
    subjectId === "maths" &&
    options?.mathsProgram
  ) {
    return filterMathsPoolForProgram(questions, options.mathsProgram);
  }
  return questions;
}

function resolveSubjectExamCount(
  schoolId: SchoolId,
  subjectId: SubjectId,
  mode: ExamMode,
  baseSpec: { questionCount: number; timeLimitMinutes: number },
  customForSubject: SubjectCustomOptions | undefined,
  options?: ExamBuildOptions
): number {
  if (
    schoolId === "conestoga" &&
    subjectId === "maths" &&
    options?.mathsProgram
  ) {
    return resolveMathsQuestionCount(
      mode,
      options.mathsProgram,
      baseSpec.questionCount,
      customForSubject?.questionCount
    );
  }

  return getModeQuestionCount(mode, baseSpec, {
    customQuestionCount: customForSubject?.questionCount,
  });
}

function resolveSubjectTimeLimit(
  schoolId: SchoolId,
  subjectId: SubjectId,
  mode: ExamMode,
  baseSpec: { questionCount: number; timeLimitMinutes: number },
  customForSubject: SubjectCustomOptions | undefined,
  options?: ExamBuildOptions
): number | null {
  if (
    mode === "mock" &&
    schoolId === "conestoga" &&
    subjectId === "maths" &&
    options?.mathsProgram
  ) {
    return getMathsScaledTimeLimit(
      options.mathsProgram,
      baseSpec.timeLimitMinutes
    );
  }

  return getModeTimeLimitMinutes(mode, baseSpec, {
    customTimeLimitMinutes: customForSubject?.timeLimitMinutes,
  });
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

    const examCount = resolveSubjectExamCount(
      schoolId,
      subjectId,
      mode,
      baseSpec,
      customForSubject,
      options
    );

    let pool = filterExamEligibleQuestions(
      resolveSubjectQuestionPool(
        schoolId,
        subjectId,
        bank.questions,
        options
      )
    );

    const studyTopics = options?.studyTopicsBySubject?.[subjectId];
    if (mode === "study" && studyTopics?.length) {
      pool = filterQuestionsByStudyTopics(pool, studyTopics);
    }

    const sectionQuestions: ShuffledQuestion[] = [];

    const takeCount = Math.min(examCount, pool.length);
    const selected =
      subjectId === "maths" &&
      options?.mathsProgram &&
      usesSequentialMathsOrder(mode)
        ? pool.slice(0, takeCount)
        : selectQuestionsWithBias(pool, takeCount, {
            recentSets: bank.meta?.recentExamSets ?? [],
            wrongQuestionIds: options?.wrongQuestionIdsBySubject?.[subjectId],
            focusTopics: options?.focusTopics,
          });

    bank = recordExamQuestionUsage(
      bank,
      selected.map((q) => q.id)
    );
    await saveQuestionBank(bank);

    for (const question of selected) {
      const context = resolveQuestionContext(question, bank.contexts);
      const base: ShuffledQuestion = {
        id: `${subjectId}-${question.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        originalId: question.id,
        subjectId,
        text: question.text,
        explanation: question.explanation,
        solution: question.solution,
        topic: getTopicLabel(question),
        learningObjective: getLearningObjective(question),
        tags: getQuestionTags(question),
        answerConfidence: question.meta?.answerConfidence,
        context,
        contextKey: context ? getContextKey(context, question.id) : undefined,
      };

      if (isTextGradedQuestion(question)) {
        sectionQuestions.push({
          ...base,
          questionType: "numeric",
          answer: question.answer,
          acceptedAnswers: question.acceptedAnswers,
        });
        continue;
      }

      const shuffledOptions = shuffleQuestionOptions(
        question.options ?? [],
        question.correctIndex ?? 0
      );

      const wrongHints = question.wrongAnswerHints
        ? remapWrongAnswerHints(
            question.wrongAnswerHints,
            shuffledOptions.indexMap,
            shuffledOptions.correctIndex
          )
        : undefined;

      sectionQuestions.push({
        ...base,
        questionType: "multiple_choice",
        options: shuffledOptions.options,
        correctIndex: shuffledOptions.correctIndex,
        wrongAnswerHints: wrongHints,
        distractors: question.distractors,
      });
    }

    if (sectionQuestions.length === 0) continue;

    sections.push({
      subjectId,
      questions: sectionQuestions,
      timeLimitMinutes: resolveSubjectTimeLimit(
        schoolId,
        subjectId,
        mode,
        baseSpec,
        customForSubject,
        options
      ),
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
    ...(options?.studyTopicsBySubject &&
    Object.keys(options.studyTopicsBySubject).length > 0
      ? { studyTopicsBySubject: options.studyTopicsBySubject }
      : {}),
    ...(options?.mathsProgram ? { mathsProgram: options.mathsProgram } : {}),
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

    const examCount = resolveSubjectExamCount(
      schoolId,
      subjectId,
      mode,
      baseSpec,
      customForSubject,
      options
    );
    let pool = filterExamEligibleQuestions(
      resolveSubjectQuestionPool(
        schoolId,
        subjectId,
        bank?.questions ?? [],
        options
      )
    );
    const topics = collectStudyTopics(pool);
    const totalPoolSize = pool.length;
    const studyTopics = options?.studyTopicsBySubject?.[subjectId];
    if (mode === "study" && studyTopics?.length) {
      pool = filterQuestionsByStudyTopics(pool, studyTopics);
    }
    const effectiveCount = Math.min(examCount, pool.length);
    const timeLimit =
      resolveSubjectTimeLimit(
        schoolId,
        subjectId,
        mode,
        baseSpec,
        customForSubject,
        options
      ) ?? 0;
    const poolSize = pool.length;
    const maxQuestions =
      subjectId === "maths" && options?.mathsProgram
        ? Math.min(poolSize, getMathsProgramLimit(options.mathsProgram))
        : Math.min(poolSize, baseSpec.questionCount);

    totalQuestions += effectiveCount;
    totalTimeMinutes += timeLimit;
    bySubject.push({
      subjectId,
      questionCount: effectiveCount,
      requestedCount: examCount,
      maxQuestions,
      poolSize,
      totalPoolSize,
      topics,
      studyTopics: studyTopics?.length ? studyTopics : null,
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
