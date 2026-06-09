import { NextResponse } from "next/server";
import { saveQuestionBank } from "@/lib/bank-loader";
import type { QuestionBank } from "@/types/exam";

export async function POST(request: Request) {
  try {
    const bank = (await request.json()) as QuestionBank;

    if (!bank.schoolId || !bank.subjectId || !bank.questions?.length) {
      return NextResponse.json({ error: "Invalid question bank" }, { status: 400 });
    }

    await saveQuestionBank(bank);

    return NextResponse.json({
      saved: true,
      path: `data/banks/${bank.schoolId}/${bank.subjectId}.json`,
      questionCount: bank.questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
