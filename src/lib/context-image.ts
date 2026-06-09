import type { QuestionContext, SchoolId, SubjectId } from "@/types/exam";

export function getContextImageSrc(
  context: QuestionContext,
  schoolId?: SchoolId,
  subjectId?: SubjectId
): string | null {
  if (context.imageData) return context.imageData;

  if (context.imagePath && schoolId && subjectId) {
    const filename = context.imagePath.split("/").pop();
    if (filename) {
      return `/api/bank-assets/${schoolId}/${subjectId}/${filename}`;
    }
  }

  return null;
}
