import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getAssetFilePath } from "@/lib/paths";
import type { SchoolId, SubjectId } from "@/types/exam";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ school: string; subject: string; filename: string }>;
  }
) {
  try {
    const { school, subject, filename } = await params;

    if (!filename || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = getAssetFilePath(
      school as SchoolId,
      subject as SubjectId,
      filename
    );
    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
