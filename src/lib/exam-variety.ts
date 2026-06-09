import { shuffle } from "@/lib/shuffle";
import type { Question, QuestionBank } from "@/types/exam";

/** Generate new questions every N exam starts (when pool has room to grow) */
export const REFRESH_EVERY_ATTEMPTS = 3;
/** Re-word / re-scenario existing questions every N starts */
export const TWIST_EVERY_ATTEMPTS = 5;
/** Max pool size as multiple of official exam length */
export const POOL_CAP_MULTIPLIER = 2;
export const GENERATE_ON_REFRESH = 12;
export const TWIST_BATCH_SIZE = 8;
export const RECENT_EXAM_SETS_KEPT = 3;

export function nextAttemptNumber(examStarts: number): number {
  return examStarts + 1;
}

export function shouldGenerateRefresh(
  nextAttempt: number,
  poolSize: number,
  target: number
): boolean {
  return (
    nextAttempt % REFRESH_EVERY_ATTEMPTS === 0 &&
    poolSize < target * POOL_CAP_MULTIPLIER
  );
}

export function shouldTwistQuestions(nextAttempt: number): boolean {
  return nextAttempt % TWIST_EVERY_ATTEMPTS === 0;
}

/** Prefer questions not seen in recent exams; fall back to least-recent when pool is tight */
export function selectQuestionsForExam(
  pool: Question[],
  count: number,
  recentSets: string[][] = []
): Question[] {
  const recentIds = new Set(recentSets.flat());
  const fresh = pool.filter((q) => !recentIds.has(q.id));
  const stale = pool.filter((q) => recentIds.has(q.id));

  const selected: Question[] = [];
  for (const q of shuffle(fresh)) {
    if (selected.length >= count) break;
    selected.push(q);
  }
  for (const q of shuffle(stale)) {
    if (selected.length >= count) break;
    selected.push(q);
  }

  return shuffle(selected.slice(0, count));
}

/** Pick overused sample questions to create AI variations */
export function pickQuestionsToTwist(
  pool: Question[],
  recentSets: string[][],
  count: number
): Question[] {
  const usageCount = new Map<string, number>();
  for (const set of recentSets) {
    for (const id of set) {
      usageCount.set(id, (usageCount.get(id) ?? 0) + 1);
    }
  }

  const scored = pool
    .filter((q) => q.meta?.source !== "variant")
    .map((q) => ({
      q,
      score:
        (usageCount.get(q.id) ?? 0) * 10 +
        (q.meta?.source === "generated" ? 2 : 0) +
        (q.meta?.source === "sample" || q.meta?.source === "verified" ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const picked: Question[] = [];
  const seenTopics = new Set<string>();

  for (const { q } of scored) {
    if (picked.length >= count) break;
    const topic = q.meta?.topics?.[0] ?? "general";
    if (seenTopics.has(topic) && picked.length < count - 2) continue;
    picked.push(q);
    seenTopics.add(topic);
  }

  if (picked.length < count) {
    for (const { q } of scored) {
      if (picked.length >= count) break;
      if (!picked.includes(q)) picked.push(q);
    }
  }

  return picked.slice(0, count);
}

export function recordExamQuestionUsage(
  bank: QuestionBank,
  usedQuestionIds: string[]
): QuestionBank {
  const recent = [...(bank.meta?.recentExamSets ?? []), usedQuestionIds];
  const trimmed = recent.slice(-RECENT_EXAM_SETS_KEPT);

  return {
    ...bank,
    meta: {
      topicsCovered: bank.meta?.topicsCovered ?? [],
      examBlueprint: bank.meta?.examBlueprint ?? [],
      schoolContext: bank.meta?.schoolContext,
      lastEnrichedAt: bank.meta?.lastEnrichedAt,
      lastGeneratedAt: bank.meta?.lastGeneratedAt,
      totalGenerated: bank.meta?.totalGenerated ?? 0,
      examStarts: bank.meta?.examStarts,
      recentExamSets: trimmed,
      lastTwistedAt: bank.meta?.lastTwistedAt,
      lastExamBuiltAt: new Date().toISOString(),
    },
  };
}
