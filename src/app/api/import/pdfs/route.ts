import { readdir, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/paths";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("school") as SchoolId | null;
  const subjectId = searchParams.get("subject") as SubjectId | null;

  if (!schoolId || !subjectId) {
    return NextResponse.json({ error: "school and subject are required" }, { status: 400 });
  }

  const dir = getUploadsDir(schoolId, subjectId);

  try {
    const files = await readdir(dir);
    const pdfs = await Promise.all(
      files
        .filter((f) => f.toLowerCase().endsWith(".pdf"))
        .map(async (filename) => {
          const filePath = path.join(dir, filename);
          const info = await stat(filePath);
          return {
            filename,
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
          };
        })
    );

    return NextResponse.json({ pdfs });
  } catch {
    return NextResponse.json({ pdfs: [] });
  }
}
