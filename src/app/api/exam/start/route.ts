import { NextResponse } from "next/server";
import { ensureBanksForSubjects } from "@/lib/bank-manager";
import { buildExamSession } from "@/lib/build-exam-session";
import { parseBuildOptionsFromBody } from "@/lib/parse-build-options";
import {
  completePrepareJob,
  initPrepareJob,
} from "@/lib/prepare-progress";
import type { ExamMode, SchoolId, SubjectId } from "@/types/exam";

/** Legacy combined prepare + build — prefer /api/exam/prepare then /api/exam/build */
export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { school, subjects, mode, jobId } = body as {
      school: SchoolId;
      subjects: SubjectId[];
      mode: ExamMode;
      jobId?: string;
    };

    if (!school || !subjects?.length || !mode) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const id = jobId ?? crypto.randomUUID();
    initPrepareJob(id, school, subjects);

    const bankResults = await ensureBanksForSubjects(school, subjects, id);
    completePrepareJob(id);

    const options = parseBuildOptionsFromBody(mode, body);
    const session = await buildExamSession(school, subjects, mode, options);
    if (!session) {
      return NextResponse.json({ error: "No questions available" }, { status: 404 });
    }

    return NextResponse.json({ session, bankResults, jobId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
