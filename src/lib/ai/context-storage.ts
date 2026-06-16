import { z } from "zod";
import type { QuestionContext } from "@/types/exam";

export const aiContextSchema = z.object({
  id: z.string(),
  type: z.enum([
    "passage",
    "comprehension",
    "graph",
    "table",
    "diagram",
    "image",
  ]),
  title: z.string().nullable(),
  content: z.string(),
});

export type AiContext = z.infer<typeof aiContextSchema>;

export function nextUniqueContextKey(
  existing: Record<string, QuestionContext>,
  seed: string,
  index: number
): string {
  const base = `ctx-${seed}-${index}`.replace(/[^a-zA-Z0-9-_]/g, "-");
  let key = base;
  let suffix = 0;
  while (existing[key]) {
    suffix++;
    key = `${base}-${suffix}`;
  }
  return key;
}

export function mergeAiContexts(
  existing: Record<string, QuestionContext> | undefined,
  contexts: AiContext[] | null | undefined,
  seed: string
): {
  contexts: Record<string, QuestionContext>;
  idMap: Map<string, string>;
} {
  const merged: Record<string, QuestionContext> = { ...existing };
  const idMap = new Map<string, string>();

  for (const [index, ctx] of (contexts ?? []).entries()) {
    const key = nextUniqueContextKey(merged, seed, index);
    idMap.set(ctx.id, key);
    merged[key] = {
      id: key,
      type: ctx.type,
      title: ctx.title ?? undefined,
      content: ctx.content,
    };
  }

  return { contexts: merged, idMap };
}

export function resolveAiContextId(
  contextId: string | null | undefined,
  idMap: Map<string, string>
): string | undefined {
  if (!contextId) return undefined;
  return idMap.get(contextId) ?? contextId;
}
