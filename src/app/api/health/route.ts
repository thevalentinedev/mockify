import { NextResponse } from "next/server";
import { isDbEnabled } from "@/lib/db";

/** Quick deploy check — does not expose secret values */
export async function GET() {
  return NextResponse.json({
    ok: true,
    openai: Boolean(process.env.OPENAI_API_KEY),
    database: isDbEnabled(),
    vercel: Boolean(process.env.VERCEL),
  });
}
