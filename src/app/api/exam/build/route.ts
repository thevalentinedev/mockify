import { NextResponse } from "next/server";
import { buildExamSession } from "@/lib/build-exam-session";
import { parseBuildOptionsFromBody } from "@/lib/parse-build-options";
import type { ExamMode, SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { school, subjects, mode } = body as {
      school: SchoolId;
      subjects: SubjectId[];
      mode: ExamMode;
    };

    if (!school || !subjects?.length || !mode) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const options = parseBuildOptionsFromBody(mode, body);
    const session = await buildExamSession(school, subjects, mode, options);
    if (!session) {
      return NextResponse.json({ error: "No questions available" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
