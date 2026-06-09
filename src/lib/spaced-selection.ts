import { shuffle } from "@/lib/shuffle";
import type { Question } from "@/types/exam";

interface SelectOptions {
  recentSets?: string[][];
  wrongQuestionIds?: string[];
  focusTopics?: string[];
}

/**
 * Prefer fresh questions, then weak-topic / previously-wrong, then the rest.
 */
export function selectQuestionsWithBias(
  pool: Question[],
  count: number,
  options: SelectOptions = {}
): Question[] {
  const recentIds = new Set((options.recentSets ?? []).flat());
  const wrongIds = new Set(options.wrongQuestionIds ?? []);
  const focusTopics = new Set(options.focusTopics ?? []);

  const fresh = pool.filter((q) => !recentIds.has(q.id));
  const weak = pool.filter(
    (q) =>
      recentIds.has(q.id) &&
      (wrongIds.has(q.id) ||
        (q.meta?.topics?.[0] && focusTopics.has(q.meta.topics[0])))
  );
  const stale = pool.filter(
    (q) => recentIds.has(q.id) && !weak.includes(q)
  );

  const selected: Question[] = [];
  for (const bucket of [shuffle(fresh), shuffle(weak), shuffle(stale)]) {
    for (const q of bucket) {
      if (selected.length >= count) break;
      if (!selected.includes(q)) selected.push(q);
    }
    if (selected.length >= count) break;
  }

  return shuffle(selected.slice(0, count));
}
