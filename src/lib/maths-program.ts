import { QUICK_QUESTION_COUNT } from "@/lib/exam-config";
import type { ExamMode, MathsProgramId, Question } from "@/types/exam";

export type { MathsProgramId } from "@/types/exam";

export interface MathsProgram {
  id: MathsProgramId;
  questionLimit: number;
  label: string;
  description: string;
}

/** Conestoga Math Skills Assessment program requirements */
export const MATHS_PROGRAMS: MathsProgram[] = [
  {
    id: "engineering",
    questionLimit: 100,
    label: "Engineering Technology / Aviation",
    description:
      "Questions 1–100. Engineering Technology/Technician (except Woodworking), General Arts & Science – Aviation.",
  },
  {
    id: "business",
    questionLimit: 88,
    label: "Business programs",
    description: "Questions 1–88.",
  },
  {
    id: "trades-health",
    questionLimit: 72,
    label: "Trades, health & certificates",
    description:
      "Questions 1–72. Certificate and Trades, Woodworking, Health Sciences, and General Arts & Science.",
  },
];

const PROGRAM_BY_ID = Object.fromEntries(
  MATHS_PROGRAMS.map((program) => [program.id, program])
) as Record<MathsProgramId, MathsProgram>;

export function getMathsProgram(programId: MathsProgramId): MathsProgram {
  return PROGRAM_BY_ID[programId];
}

export function getMathsProgramLimit(programId: MathsProgramId): number {
  return getMathsProgram(programId).questionLimit;
}

export function getMathsPdfQuestionNumber(id: string): number | null {
  const match = id.match(/^math-(\d+)$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function filterMathsPoolForProgram(
  questions: Question[],
  programId: MathsProgramId
): Question[] {
  const limit = getMathsProgramLimit(programId);
  return questions
    .filter((question) => {
      const number = getMathsPdfQuestionNumber(question.id);
      return number !== null && number >= 1 && number <= limit;
    })
    .sort(
      (a, b) =>
        (getMathsPdfQuestionNumber(a.id) ?? 0) -
        (getMathsPdfQuestionNumber(b.id) ?? 0)
    );
}

export function getMathsScaledTimeLimit(
  programId: MathsProgramId,
  fullExamMinutes: number
): number {
  const limit = getMathsProgramLimit(programId);
  return Math.max(1, Math.round((fullExamMinutes * limit) / 100));
}

export function resolveMathsQuestionCount(
  mode: ExamMode,
  programId: MathsProgramId,
  fullExamCount: number,
  customCount?: number
): number {
  const limit = getMathsProgramLimit(programId);
  if (mode === "practice" || mode === "mock") {
    return Math.min(limit, fullExamCount);
  }
  return Math.min(customCount ?? QUICK_QUESTION_COUNT, limit);
}

export function usesSequentialMathsOrder(mode: ExamMode): boolean {
  return mode === "practice" || mode === "mock";
}
