import { readFile } from "fs/promises";
import path from "path";
import { getAssetFilePath } from "@/lib/paths";
import type { QuestionBank } from "@/types/exam";

/** Upload context images to Vercel Blob when BLOB_READ_WRITE_TOKEN is set */
export async function uploadBankContextImages(
  bank: QuestionBank
): Promise<QuestionBank> {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !bank.contexts) return bank;

  try {
    const { put } = await import("@vercel/blob");
    const contexts = { ...bank.contexts };

    for (const [key, ctx] of Object.entries(contexts)) {
      if (!ctx.imagePath || ctx.imageData?.startsWith("https://")) continue;

      const filename = path.basename(ctx.imagePath);
      const filePath = getAssetFilePath(bank.schoolId, bank.subjectId, filename);

      let body: Buffer;
      try {
        body = await readFile(filePath);
      } catch {
        if (!ctx.imageData?.startsWith("data:image")) continue;
        const base64 = ctx.imageData.split(",")[1];
        body = Buffer.from(base64, "base64");
      }

      const blob = await put(
        `banks/${bank.schoolId}/${bank.subjectId}/${filename}`,
        body,
        { access: "public", contentType: "image/png" }
      );

      contexts[key] = {
        ...ctx,
        imageData: blob.url,
      };
    }

    return { ...bank, contexts };
  } catch {
    return bank;
  }
}

export async function ensureContextImagesPersisted(
  bank: QuestionBank
): Promise<QuestionBank> {
  const withBlob = await uploadBankContextImages(bank);
  return withBlob;
}
