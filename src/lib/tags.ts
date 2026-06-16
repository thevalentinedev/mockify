import type { Question, ShuffledQuestion } from "@/types/exam";

type TaggedQuestion = Pick<Question, "meta" | "tags"> | Pick<ShuffledQuestion, "tags" | "topic">;

const TAG_ALIASES: Record<string, string[]> = {
  "least common denominator": ["lcd"],
  "common denominators": ["lcd"],
  fractions: ["fractions"],
  trigonometry: ["trigonometry", "trig"],
  "reading comprehension": ["reading", "comprehension"],
  punctuation: ["punctuation"],
  capitalization: ["capitalization"],
};

export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildTagsFromTopics(topics: string[]): string[] {
  const tags = new Set<string>();

  for (const topic of topics) {
    const normalizedTopic = topic.trim().toLowerCase();
    const slug = normalizeTag(topic);
    if (slug) tags.add(slug);

    for (const [phrase, aliases] of Object.entries(TAG_ALIASES)) {
      if (normalizedTopic.includes(phrase)) {
        for (const alias of aliases) tags.add(alias);
      }
    }

    for (const word of normalizedTopic.match(/[a-z0-9]+/g) ?? []) {
      if (word.length >= 4) tags.add(word);
    }
  }

  return [...tags];
}

export function getQuestionTags(question: TaggedQuestion): string[] {
  if ("meta" in question) {
    if (question.tags?.length) return question.tags;
    if (question.meta?.tags?.length) return question.meta.tags;
    if (question.meta?.topics?.length) {
      return buildTagsFromTopics(question.meta.topics);
    }
    return [];
  }

  return question.tags ?? [];
}

export function questionMatchesTag(question: Question, tag: string): boolean {
  const needle = normalizeTag(tag);
  return getQuestionTags(question).some((candidate) => {
    const normalized = normalizeTag(candidate);
    return normalized === needle || normalized.includes(needle);
  });
}

export function matchesFocusTarget(question: Question, focus: string): boolean {
  const normalizedFocus = normalizeTag(focus);
  if (!normalizedFocus) return false;

  if (getQuestionTags(question).some((tag) => normalizeTag(tag) === normalizedFocus)) {
    return true;
  }

  const objective = question.meta?.learningObjective ?? question.learningObjective;
  if (objective && normalizeTag(objective) === normalizedFocus) return true;

  return (
    question.meta?.topics?.some((topic) => normalizeTag(topic) === normalizedFocus) ??
    false
  );
}
