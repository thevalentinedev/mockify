import type { QuestionBank, SchoolId, SubjectId } from "@/types/exam";
import { biologyBank } from "./conestoga/biology";
import { chemistryBank } from "./conestoga/chemistry";
import { englishBank } from "./conestoga/english";
import { mathsBank } from "./conestoga/maths";

const BANKS: Record<SchoolId, Partial<Record<SubjectId, QuestionBank>>> = {
  conestoga: {
    english: englishBank,
    maths: mathsBank,
    biology: biologyBank,
    chemistry: chemistryBank,
  },
};

export function getStaticQuestionBank(
  schoolId: SchoolId,
  subjectId: SubjectId
): QuestionBank | null {
  return BANKS[schoolId]?.[subjectId] ?? null;
}

export function getStaticAvailableSubjects(schoolId: SchoolId): SubjectId[] {
  const schoolBanks = BANKS[schoolId];
  if (!schoolBanks) return [];
  return Object.keys(schoolBanks) as SubjectId[];
}
