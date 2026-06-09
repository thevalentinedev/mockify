import { NextResponse } from "next/server";
import { ensureBanksForSubjects } from "@/lib/bank-manager";
import {
  completePrepareJob,
  initPrepareJob,
} from "@/lib/prepare-progress";
import type { SchoolId, SubjectId } from "@/types/exam";

/** Allow long first-time bank builds (Hobby max 10s; Pro up to 300s) */
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { school, subjects, jobId, userAttempts } = body as {
      school: SchoolId;
      subjects: SubjectId[];
      jobId?: string;
      userAttempts?: Partial<Record<SubjectId, number>>;
    };

    if (!school || !subjects?.length) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const id = jobId ?? crypto.randomUUID();
    initPrepareJob(id, school, subjects);

    const bankResults = await ensureBanksForSubjects(
      school,
      subjects,
      id,
      userAttempts
    );
    completePrepareJob(id);

    return NextResponse.json({ jobId: id, bankResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
