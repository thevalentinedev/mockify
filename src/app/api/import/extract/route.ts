import path from "path";
import { NextResponse } from "next/server";
import { extractQuestionsFromText, toQuestionBank } from "@/lib/ai-extract";
import {
  attachPdfImagesToBank,
  bankNeedsImageExtraction,
} from "@/lib/pdf-context-images";
import { extractPdfBundle } from "@/lib/pdf-extract";
import { getUploadsDir } from "@/lib/paths";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { school, subject, filename, questionCount, timeLimitMinutes } = body as {
      school: SchoolId;
      subject: SubjectId;
      filename: string;
      questionCount?: number;
      timeLimitMinutes?: number;
    };

    if (!school || !subject || !filename) {
      return NextResponse.json(
        { error: "school, subject, and filename are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const filePath = path.join(getUploadsDir(school, subject), filename);
    const pdfBundle = await extractPdfBundle(filePath);
    const extraction = await extractQuestionsFromText(
      pdfBundle.text,
      school,
      subject
    );
    let bank = toQuestionBank(extraction, school, subject, {
      questionCount,
      timeLimitMinutes,
    });

    let figuresAttached = 0;
    if (bankNeedsImageExtraction(bank)) {
      const { bank: withImages, attached } = await attachPdfImagesToBank(
        bank,
        filePath
      );
      bank = withImages;
      figuresAttached = attached;
    }

    return NextResponse.json({
      extraction,
      bank,
      figuresAttached,
      embeddedImageCount: pdfBundle.images.length,
      textPreview: pdfBundle.text.slice(0, 500),
      unansweredCount: extraction.questions.filter((q) => q.correctIndex === null).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
