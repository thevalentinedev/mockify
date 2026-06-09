import path from "path";
import { NextResponse } from "next/server";
import { enrichQuestionBankDetailed } from "@/lib/ai/enrich-bank";
import { generatePracticeQuestions } from "@/lib/ai/generate-questions";
import { extractQuestionsFromText, toQuestionBank } from "@/lib/ai-extract";
import { getQuestionBank, saveQuestionBank } from "@/lib/bank-loader";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { getUploadsDir } from "@/lib/paths";
import { getExamSpec } from "@/lib/exam-config";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      school,
      subject,
      filename,
      generateCount = 10,
      enrichOnly = false,
    } = body as {
      school: SchoolId;
      subject: SubjectId;
      filename?: string;
      generateCount?: number;
      enrichOnly?: boolean;
    };

    if (!school || !subject) {
      return NextResponse.json({ error: "school and subject are required" }, { status: 400 });
    }

    let bank = await getQuestionBank(school, subject);
    let extracted = 0;

    if (filename && !enrichOnly) {
      const filePath = path.join(getUploadsDir(school, subject), filename);
      const text = await extractTextFromPdf(filePath);
      const extraction = await extractQuestionsFromText(text, school, subject);
      bank = toQuestionBank(extraction, school, subject);
      extracted = bank.questions.length;
      await saveQuestionBank(bank);
    }

    if (!bank?.questions.length) {
      return NextResponse.json(
        { error: "No questions found. Upload a PDF first." },
        { status: 404 }
      );
    }

    // Official exam specs (Conestoga) — PDF samples define topics, not exam length
    const spec = getExamSpec(school, subject);
    const examConfig = spec ?? { ...bank.config };

    const enrichResult = await enrichQuestionBankDetailed(bank);
    bank = enrichResult.bank;
    bank.config = examConfig;

    let added = 0;
    if (!enrichOnly) {
      const before = bank.questions.length;
      const safeCount = Math.min(Math.max(generateCount, 0), 30);
      if (safeCount > 0) {
        bank = await generatePracticeQuestions(bank, safeCount);
        added = bank.questions.length - before;
      }
    }

    // Pool grows; exam question count & time stay from PDF
    bank.config = examConfig;
    await saveQuestionBank(bank);

    return NextResponse.json({
      saved: true,
      extracted,
      examQuestionCount: examConfig.questionCount,
      poolSize: bank.questions.length,
      added,
      enrichedCount: enrichResult.enrichedCount,
      skippedCount: enrichResult.skippedCount,
      topics: bank.meta?.topicsCovered ?? [],
      path: `data/banks/${school}/${subject}.json`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prepare failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
