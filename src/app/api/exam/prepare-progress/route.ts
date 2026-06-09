import { NextResponse } from "next/server";
import { getPrepareProgress } from "@/lib/prepare-progress";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const progress = getPrepareProgress(jobId);
  if (!progress) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(progress, {
    headers: { "Cache-Control": "no-store" },
  });
}
