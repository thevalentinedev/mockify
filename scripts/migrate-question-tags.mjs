#!/usr/bin/env node
/**
 * Add compact meta.tags derived from meta.topics for easier search/filtering.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banksRoot = join(__dirname, "../data/banks");

const TAG_ALIASES = {
  "least common denominator": ["lcd"],
  "common denominators": ["lcd"],
  fractions: ["fractions"],
  trigonometry: ["trigonometry", "trig"],
  "reading comprehension": ["reading", "comprehension"],
  punctuation: ["punctuation"],
  capitalization: ["capitalization"],
};

function normalizeTag(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTagsFromTopics(topics) {
  const tags = new Set();

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

let total = 0;

for (const schoolId of readdirSync(banksRoot)) {
  const schoolDir = join(banksRoot, schoolId);
  if (!statSync(schoolDir).isDirectory()) continue;

  for (const file of readdirSync(schoolDir).filter((f) => f.endsWith(".json"))) {
    const path = join(schoolDir, file);
    const bank = JSON.parse(readFileSync(path, "utf8"));
    let updated = 0;

    for (const question of bank.questions) {
      if (!question.meta?.topics?.length) continue;
      if (question.meta.tags?.length) continue;

      const tags = buildTagsFromTopics(question.meta.topics);
      if (!tags.length) continue;

      question.meta.tags = tags;
      updated++;
    }

    if (updated > 0) {
      writeFileSync(path, `${JSON.stringify(bank, null, 2)}\n`);
      console.log(`${schoolId}/${file}: tagged ${updated} questions`);
      total += updated;
    } else {
      console.log(`${schoolId}/${file}: already tagged`);
    }
  }
}

console.log(`Done. Tagged ${total} questions.`);
