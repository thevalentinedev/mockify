#!/usr/bin/env node
/**
 * Add explicit questionType to every question in bank JSON files.
 * - multiple_choice when options are present
 * - numeric when answer is set without options
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banksRoot = join(__dirname, "../data/banks");

const QUESTION_TYPES = new Set([
  "multiple_choice",
  "multi_select",
  "numeric",
  "short_answer",
  "essay",
  "true_false",
]);

function coerceQuestionType(raw) {
  if (!raw) return undefined;
  if (raw === "choice") return "multiple_choice";
  if (QUESTION_TYPES.has(raw)) return raw;
  return undefined;
}

function resolveQuestionType(question) {
  const coerced = coerceQuestionType(question.questionType);
  if (coerced) return coerced;

  if (question.answer && !question.options?.length) return "numeric";
  if (question.options?.length === 2) return "true_false";
  if (question.options?.length) return "multiple_choice";

  return "multiple_choice";
}

function normalizeBank(bank) {
  let updated = 0;
  for (const question of bank.questions) {
    const questionType = resolveQuestionType(question);
    if (question.questionType !== questionType) {
      question.questionType = questionType;
      updated++;
    }
  }
  return updated;
}

let total = 0;

for (const schoolId of readdirSync(banksRoot)) {
  const schoolDir = join(banksRoot, schoolId);
  if (!statSync(schoolDir).isDirectory()) continue;
  for (const file of readdirSync(schoolDir).filter((f) => f.endsWith(".json"))) {
    const path = join(schoolDir, file);
    const bank = JSON.parse(readFileSync(path, "utf8"));
    const updated = normalizeBank(bank);
    if (updated > 0) {
      writeFileSync(path, `${JSON.stringify(bank, null, 2)}\n`);
      console.log(`${schoolId}/${file}: set questionType on ${updated} questions`);
      total += updated;
    } else {
      console.log(`${schoolId}/${file}: already normalized`);
    }
  }
}

console.log(`Done. Updated ${total} questions.`);
