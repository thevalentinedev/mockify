import type { QuestionBank, QuestionContext } from "@/types/exam";

const VISUAL_CONTEXT_TYPES = new Set(["diagram", "graph", "image", "table"]);
export const PLACEHOLDER_RE =
  /not included in the extracted text|actual diagram is not|actual graph is not/i;

export function contextsNeedingImages(bank: QuestionBank): QuestionContext[] {
  if (!bank.contexts) return [];

  return Object.values(bank.contexts).filter((ctx) => {
    if (ctx.imageData || ctx.imagePath) return false;
    if (!VISUAL_CONTEXT_TYPES.has(ctx.type)) return false;
    return PLACEHOLDER_RE.test(ctx.content) || ctx.type !== "table";
  });
}

export function bankNeedsImageExtraction(bank: QuestionBank): boolean {
  return contextsNeedingImages(bank).length > 0;
}
