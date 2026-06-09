import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/paths";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function POST(request: Request) {
  const formData = await request.formData();
  const schoolId = formData.get("school") as SchoolId | null;
  const subjectId = formData.get("subject") as SubjectId | null;
  const file = formData.get("file");

  if (!schoolId || !subjectId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "school, subject, and a PDF file are required" },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const dir = getUploadsDir(schoolId, subjectId);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ filename: safeName, path: `uploads/${schoolId}/${subjectId}/${safeName}` });
}
