import { readdir } from "fs/promises";
import path from "path";
import { getUploadsDir } from "@/lib/paths";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function findSubjectPdf(
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<string | null> {
  const dir = getUploadsDir(schoolId, subjectId);

  try {
    const files = await readdir(dir);
    const pdfs = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) return null;
    // Prefer the most recently added naming convention; first PDF is fine
    return path.join(dir, pdfs[0]);
  } catch {
    return null;
  }
}
