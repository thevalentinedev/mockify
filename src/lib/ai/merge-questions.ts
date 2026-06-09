import type { Question } from "@/types/exam";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isDuplicateQuestion(existing: Question[], candidate: Question): boolean {
  const norm = normalize(candidate.text);
  return existing.some(
    (q) => normalize(q.text) === norm || normalize(q.text).includes(norm.slice(0, 40))
  );
}

export function mergeQuestions(existing: Question[], incoming: Question[]): Question[] {
  const merged = [...existing];

  for (const question of incoming) {
    if (!isDuplicateQuestion(merged, question)) {
      merged.push(question);
    }
  }

  return merged;
}
