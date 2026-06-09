import { NextResponse } from "next/server";
import { ensureBanksForSubjects } from "@/lib/bank-manager";
import { buildExamSession } from "@/lib/build-exam-session";
import type { ExamMode, SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { school, subjects, mode } = body as {
      school: SchoolId;
      subjects: SubjectId[];
      mode: ExamMode;
    };

    if (!school || !subjects?.length || !mode) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const bankResults = await ensureBanksForSubjects(school, subjects);
    const session = await buildExamSession(school, subjects, mode);

    if (!session) {
      return NextResponse.json({ error: "No questions available" }, { status: 404 });
    }

    return NextResponse.json({
      session,
      bankResults,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
