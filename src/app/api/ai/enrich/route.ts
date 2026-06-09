import { NextResponse } from "next/server";
import { enrichQuestionBankDetailed } from "@/lib/ai/enrich-bank";
import { getQuestionBank, saveQuestionBank } from "@/lib/bank-loader";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { school, subject } = body as { school: SchoolId; subject: SubjectId };

    if (!school || !subject) {
      return NextResponse.json({ error: "school and subject are required" }, { status: 400 });
    }

    const bank = await getQuestionBank(school, subject);
    if (!bank?.questions.length) {
      return NextResponse.json({ error: "No question bank found. Import a PDF first." }, { status: 404 });
    }

    const { bank: enriched, enrichedCount, skippedCount } =
      await enrichQuestionBankDetailed(bank);
    await saveQuestionBank(enriched);

    return NextResponse.json({
      saved: true,
      path: `data/banks/${school}/${subject}.json`,
      questionCount: enriched.questions.length,
      enrichedCount,
      skippedCount,
      topics: enriched.meta?.topicsCovered ?? [],
      blueprint: enriched.meta?.examBlueprint ?? [],
      lastEnrichedAt: enriched.meta?.lastEnrichedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
