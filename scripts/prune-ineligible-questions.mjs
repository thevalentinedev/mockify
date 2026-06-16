#!/usr/bin/env node
/**
 * Permanently remove ineligible questions from bank JSON files.
 * Mirrors src/lib/question-eligibility.ts (low/med confidence, missing solutions, etc.)
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banksRoot = join(__dirname, "../data/banks");

function isTextGraded(question) {
  return (
    question.questionType === "numeric" ||
  question.questionType === "short_answer" ||
    (Boolean(question.answer) && !question.options?.length)
  );
}

function hasSolutionContent(question) {
  if (question.solution?.steps?.length) return true;
  return Boolean(question.explanation?.trim());
}

function isPublishableConfidence(confidence) {
  return confidence === "high";
}

function isExamEligibleQuestion(question) {
  if (!isPublishableConfidence(question.meta?.answerConfidence)) return false;

  if (isTextGraded(question)) {
    const steps = question.solution?.steps?.length ?? 0;
    return Boolean(
      steps || question.explanation?.trim() || question.answer?.trim()
    );
  }

  if (!hasSolutionContent(question)) return false;

  if (question.options?.length) {
    return Boolean(
      question.distractors?.length ||
        Object.keys(question.wrongAnswerHints ?? {}).length > 0
    );
  }

  return true;
}

function walkBanks(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkBanks(full, files);
    } else if (entry.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

let totalRemoved = 0;

for (const file of walkBanks(banksRoot)) {
  const bank = JSON.parse(readFileSync(file, "utf8"));
  const before = bank.questions.length;
  const removed = bank.questions.filter((q) => !isExamEligibleQuestion(q));
  bank.questions = bank.questions.filter(isExamEligibleQuestion);

  if (removed.length > 0) {
    writeFileSync(file, `${JSON.stringify(bank, null, 2)}\n`);
    totalRemoved += removed.length;
    const rel = file.replace(`${banksRoot}/`, "");
    console.log(
      `${rel}: removed ${removed.length} (${removed.map((q) => q.id).join(", ")})`
    );
  } else {
    console.log(`${file.replace(`${banksRoot}/`, "")}: ok (${before} questions)`);
  }
}

console.log(`\nDone. Removed ${totalRemoved} ineligible question(s).`);
