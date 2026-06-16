#!/usr/bin/env node
/**
 * Convert meta.difficulty from legacy strings ("easy", "medium", "hard")
 * to numeric scores 1–5.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banksRoot = join(__dirname, "../data/banks");

const LEGACY = {
  very_easy: 1,
  veryeasy: 1,
  easy: 2,
  medium: 3,
  med: 3,
  hard: 4,
  very_hard: 5,
  veryhard: 5,
};

function coerceDifficulty(value) {
  if (typeof value === "number" && value >= 1 && value <= 5) return value;
  if (typeof value === "string") {
    const asNumber = Number(value.trim());
    if (asNumber >= 1 && asNumber <= 5) return asNumber;
    const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    return LEGACY[key];
  }
  return undefined;
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
      if (!question.meta?.difficulty) continue;
      const score = coerceDifficulty(question.meta.difficulty);
      if (score === undefined || question.meta.difficulty === score) continue;
      question.meta.difficulty = score;
      updated++;
    }

    if (updated > 0) {
      writeFileSync(path, `${JSON.stringify(bank, null, 2)}\n`);
      console.log(`${schoolId}/${file}: converted ${updated} difficulty values`);
      total += updated;
    } else {
      console.log(`${schoolId}/${file}: already numeric`);
    }
  }
}

console.log(`Done. Converted ${total} difficulty values.`);
