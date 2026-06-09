import { NextResponse } from "next/server";
import { getQuestionBank } from "@/lib/bank-loader";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("school") as SchoolId | null;
  const subjectId = searchParams.get("subject") as SubjectId | null;

  if (!schoolId || !subjectId) {
    return NextResponse.json({ error: "school and subject are required" }, { status: 400 });
  }

  const bank = await getQuestionBank(schoolId, subjectId);

  if (!bank) {
    return NextResponse.json({ bank: null });
  }

  return NextResponse.json({ bank });
}
