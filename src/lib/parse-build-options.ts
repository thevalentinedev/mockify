import type { ExamBuildOptions } from "@/lib/build-exam-session";
import type {
  ExamMode,
  MathsProgramId,
  SubjectCustomOptions,
  SubjectId,
} from "@/types/exam";

export function parseBuildOptionsFromBody(
  mode: ExamMode,
  body: Record<string, unknown>
): ExamBuildOptions | undefined {
  const focusTopics = body.focusTopics as string[] | undefined;
  const studyTopicsBySubject = body.studyTopicsBySubject as
    | Partial<Record<SubjectId, string[]>>
    | undefined;
  const customPerSubject = body.customPerSubject as
    | Partial<Record<SubjectId, SubjectCustomOptions>>
    | undefined;
  const wrongQuestionIdsBySubject = body.wrongQuestionIdsBySubject as
    | Partial<Record<SubjectId, string[]>>
    | undefined;
  const mathsProgram = body.mathsProgram as MathsProgramId | undefined;

  const legacyCustom =
    mode === "custom"
      ? {
          customQuestionCount: body.customQuestionCount as number | undefined,
          customTimeLimitMinutes: body.customTimeLimitMinutes as number | undefined,
        }
      : {};

  const hasOptions =
    focusTopics?.length ||
    (studyTopicsBySubject &&
      Object.values(studyTopicsBySubject).some((topics) => topics?.length)) ||
    customPerSubject ||
    wrongQuestionIdsBySubject ||
    mathsProgram ||
    legacyCustom.customQuestionCount !== undefined;

  if (!hasOptions) return undefined;

  return {
    focusTopics,
    studyTopicsBySubject,
    customPerSubject,
    wrongQuestionIdsBySubject,
    mathsProgram,
    ...legacyCustom,
  };
}
