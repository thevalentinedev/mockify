import { NextResponse } from "next/server";
import { getSessionStats } from "@/lib/build-exam-session";
import type { ExamMode, SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  const body = await request.json();
  const { school, subjects, mode } = body as {
    school: SchoolId;
    subjects: SubjectId[];
    mode: ExamMode;
  };

  if (!school || !subjects?.length || !mode) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const stats = await getSessionStats(school, subjects, mode);
  return NextResponse.json(stats);
}
