import { QUICK_QUESTION_COUNT, getExamSpec } from "@/lib/exam-config";
import type { QuickSplitMode, SchoolId, SubjectId } from "@/types/exam";

/** Split quick-mode questions across subjects */
export function distributeQuickQuestions(
  schoolId: SchoolId,
  subjects: SubjectId[],
  split: QuickSplitMode
): Record<SubjectId, number> {
  if (split === "per-subject" || subjects.length === 0) {
    return Object.fromEntries(
      subjects.map((id) => [id, QUICK_QUESTION_COUNT])
    ) as Record<SubjectId, number>;
  }

  const weights = subjects.map((subjectId) => {
    const spec = getExamSpec(schoolId, subjectId);
    return spec?.questionCount ?? QUICK_QUESTION_COUNT;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || subjects.length;

  const counts: Partial<Record<SubjectId, number>> = {};
  let allocated = 0;

  subjects.forEach((subjectId, index) => {
    if (index === subjects.length - 1) {
      counts[subjectId] = Math.max(1, QUICK_QUESTION_COUNT - allocated);
      return;
    }
    const share = Math.max(
      1,
      Math.round((QUICK_QUESTION_COUNT * weights[index]) / totalWeight)
    );
    counts[subjectId] = share;
    allocated += share;
  });

  return counts as Record<SubjectId, number>;
}
