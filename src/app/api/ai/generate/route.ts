import { NextResponse } from "next/server";
import { generatePracticeQuestions } from "@/lib/ai/generate-questions";
import { getQuestionBank, saveQuestionBank } from "@/lib/bank-loader";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { school, subject, count = 10 } = body as {
      school: SchoolId;
      subject: SubjectId;
      count?: number;
    };

    if (!school || !subject) {
      return NextResponse.json({ error: "school and subject are required" }, { status: 400 });
    }

    const safeCount = Math.min(Math.max(count, 1), 30);

    const bank = await getQuestionBank(school, subject);
    if (!bank?.questions.length) {
      return NextResponse.json({ error: "No question bank found. Import a PDF first." }, { status: 404 });
    }

    const before = bank.questions.length;
    const updated = await generatePracticeQuestions(bank, safeCount);
    await saveQuestionBank(updated);

    return NextResponse.json({
      saved: true,
      path: `data/banks/${school}/${subject}.json`,
      added: updated.questions.length - before,
      totalQuestions: updated.questions.length,
      totalGenerated: updated.meta?.totalGenerated ?? 0,
      lastGeneratedAt: updated.meta?.lastGeneratedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
