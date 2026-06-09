import path from "path";
import type { SchoolId, SubjectId } from "@/types/exam";

export function getUploadsDir(schoolId: SchoolId, subjectId: SubjectId): string {
  return path.join(process.cwd(), "uploads", schoolId, subjectId);
}

export function getBankPath(schoolId: SchoolId, subjectId: SubjectId): string {
  return path.join(process.cwd(), "data", "banks", schoolId, `${subjectId}.json`);
}

export function getBanksDir(schoolId: SchoolId): string {
  return path.join(process.cwd(), "data", "banks", schoolId);
}
