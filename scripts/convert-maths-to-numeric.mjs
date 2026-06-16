#!/usr/bin/env node
/**
 * Restore maths PDF questions (math-001..math-100) to numeric free-response format.
 * MCQ conversion put the correct answer at options[correctIndex]; math-077 stays choice.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bankPath = join(__dirname, "../data/banks/conestoga/maths.json");

function buildAcceptedAnswers(answer) {
  const accepted = new Set([answer]);

  const frac = answer.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const val = Number(frac[1]) / Number(frac[2]);
    if (Number.isFinite(val)) {
      accepted.add(String(val));
      accepted.add(val.toFixed(1));
      accepted.add(val.toFixed(2));
    }
  }

  if (answer.includes(" square units")) {
    accepted.add(answer.replace(" square units", ""));
  }

  if (answer.startsWith("(") && answer.endsWith(")")) {
    accepted.add(answer.replace(/\s/g, ""));
  }

  if (/^-?\d+(\.\d+)?$/.test(answer)) {
    const n = Number(answer);
    if (Number.isInteger(n)) {
      accepted.add(`${n}.0`);
      accepted.add(`${n}.00`);
    }
  }

  return [...accepted];
}

function isPdfMathId(id) {
  const match = id.match(/^math-(\d+)$/);
  if (!match) return false;
  const n = Number(match[1]);
  return n >= 1 && n <= 100;
}

const bank = JSON.parse(readFileSync(bankPath, "utf8"));
let converted = 0;

for (const question of bank.questions) {
  if (!isPdfMathId(question.id)) continue;
  if (question.id === "math-077") {
    question.questionType = "multiple_choice";
    continue;
  }

  const answer = question.options?.[question.correctIndex ?? 0];
  if (!answer) {
    console.warn(`Skipping ${question.id}: no answer in options`);
    continue;
  }

  question.questionType = "numeric";
  question.answer = answer;
  question.acceptedAnswers = buildAcceptedAnswers(answer);
  delete question.options;
  delete question.correctIndex;
  delete question.wrongAnswerHints;
  converted++;
}

writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Converted ${converted} maths questions to numeric format.`);
