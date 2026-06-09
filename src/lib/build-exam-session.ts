import { getQuestionBank } from "@/lib/bank-loader";
import { getExamSpec } from "@/lib/exam-config";
import { getContextKey, resolveQuestionContext } from "@/lib/question-context";
import { remapWrongAnswerHints, shuffle, shuffleQuestionOptions } from "@/lib/shuffle";
import type {
  ExamMode,
  ExamSession,
  SchoolId,
  ShuffledQuestion,
  SubjectId,
} from "@/types/exam";

export async function buildExamSession(
  schoolId: SchoolId,
  subjects: SubjectId[],
  mode: ExamMode
): Promise<ExamSession | null> {
  const questions: ShuffledQuestion[] = [];
  let totalTimeMinutes = 0;

  for (const subjectId of subjects) {
    const bank = await getQuestionBank(schoolId, subjectId);
    if (!bank?.questions.length) continue;

    const spec = getExamSpec(schoolId, subjectId);
    const examCount = spec?.questionCount ?? bank.config.questionCount;

    // Pull exam-sized set from the larger pool (PDF samples + AI-generated)
    const selected = shuffle(bank.questions).slice(
      0,
      Math.min(examCount, bank.questions.length)
    );

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
      questions.push({
        id: `${subjectId}-${question.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        originalId: question.id,
        subjectId,
        text: question.text,
        options: shuffledOptions.options,
        correctIndex: shuffledOptions.correctIndex,
        explanation: question.explanation,
        wrongAnswerHints: wrongHints,
        topic: question.meta?.topics?.[0],
        context,
        contextKey: context ? getContextKey(context, question.id) : undefined,
      });
    }

    totalTimeMinutes += spec?.timeLimitMinutes ?? bank.config.timeLimitMinutes;
  }

  if (questions.length === 0) return null;

  return {
    schoolId,
    subjects,
    mode,
    questions: shuffle(questions),
    timeLimitMinutes: mode === "mock" ? totalTimeMinutes : null,
    startedAt: Date.now(),
  };
}

export async function getSessionStats(
  schoolId: SchoolId,
  subjects: SubjectId[],
  mode: ExamMode
) {
  let totalQuestions = 0;
  let totalTimeMinutes = 0;
  const bySubject = [];

  for (const subjectId of subjects) {
    const spec = getExamSpec(schoolId, subjectId);
    const bank = await getQuestionBank(schoolId, subjectId);

    const examCount = spec?.questionCount ?? bank?.config.questionCount ?? 0;
    const timeLimit = spec?.timeLimitMinutes ?? bank?.config.timeLimitMinutes ?? 0;
    const poolSize = bank?.questions.length ?? 0;

    totalQuestions += examCount;
    totalTimeMinutes += timeLimit;
    bySubject.push({
      subjectId,
      questionCount: examCount,
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
  };
}
