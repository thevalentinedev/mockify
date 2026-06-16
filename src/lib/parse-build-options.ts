import type { ExamBuildOptions } from "@/lib/build-exam-session";
import type {
  ExamMode,
  SubjectCustomOptions,
  SubjectId,
} from "@/types/exam";

export function parseBuildOptionsFromBody(
  mode: ExamMode,
  body: Record<string, unknown>
): ExamBuildOptions | undefined {
  const focusTopics = body.focusTopics as string[] | undefined;
  const customPerSubject = body.customPerSubject as
    | Partial<Record<SubjectId, SubjectCustomOptions>>
    | undefined;
  const wrongQuestionIdsBySubject = body.wrongQuestionIdsBySubject as
    | Partial<Record<SubjectId, string[]>>
    | undefined;

  const legacyCustom =
    mode === "custom"
      ? {
          customQuestionCount: body.customQuestionCount as number | undefined,
          customTimeLimitMinutes: body.customTimeLimitMinutes as number | undefined,
        }
      : {};

  const hasOptions =
    focusTopics?.length ||
    customPerSubject ||
    wrongQuestionIdsBySubject ||
    legacyCustom.customQuestionCount !== undefined;

  if (!hasOptions) return undefined;

  return {
    focusTopics,
    customPerSubject,
    wrongQuestionIdsBySubject,
    ...legacyCustom,
  };
}
