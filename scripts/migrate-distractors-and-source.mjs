#!/usr/bin/env node
/**
 * Migrate wrongAnswerHints → distractors and add bank-level source metadata.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banksRoot = join(__dirname, "../data/banks");

const EXAM_SOURCES = {
  maths: {
    institution: "Conestoga College",
    exam: "Pre-Admission Math Assessment",
    year: null,
  },
  english: {
    institution: "Conestoga College",
    exam: "Pre-Admission English Assessment",
    year: null,
  },
  biology: {
    institution: "Conestoga College",
    exam: "Pre-Admission Biology Assessment",
    year: null,
  },
  chemistry: {
    institution: "Conestoga College",
    exam: "Pre-Admission Chemistry Assessment",
    year: null,
  },
};

function buildDistractors(question) {
  if (question.distractors?.length) return question.distractors;
  if (!question.wrongAnswerHints || !question.options?.length) return undefined;

  const distractors = [];
  for (const [indexKey, reason] of Object.entries(question.wrongAnswerHints)) {
    const index = Number(indexKey);
    const answer = question.options[index];
    if (!answer?.trim() || !reason?.trim()) continue;
    if (index === question.correctIndex) continue;
    distractors.push({ answer, reason: reason.trim() });
  }
  return distractors.length > 0 ? distractors : undefined;
}

let distractorCount = 0;
let sourceCount = 0;

for (const schoolId of readdirSync(banksRoot)) {
  const schoolDir = join(banksRoot, schoolId);
  if (!statSync(schoolDir).isDirectory()) continue;

  for (const file of readdirSync(schoolDir).filter((f) => f.endsWith(".json"))) {
    const subjectId = file.replace(/\.json$/, "");
    const path = join(schoolDir, file);
    const bank = JSON.parse(readFileSync(path, "utf8"));
    let fileDistractors = 0;

    for (const question of bank.questions) {
      const distractors = buildDistractors(question);
      if (distractors && !question.distractors?.length) {
        question.distractors = distractors;
        fileDistractors++;
      }
    }

    const examSource = EXAM_SOURCES[subjectId];
    if (examSource && !bank.meta?.source) {
      bank.meta = { ...(bank.meta ?? { topicsCovered: [], examBlueprint: [], totalGenerated: 0 }), source: examSource };
      sourceCount++;
    }

    if (fileDistractors > 0 || (examSource && !bank.meta?.source)) {
      writeFileSync(path, `${JSON.stringify(bank, null, 2)}\n`);
    }

    if (fileDistractors > 0) {
      console.log(`${schoolId}/${file}: added distractors to ${fileDistractors} questions`);
      distractorCount += fileDistractors;
    }
    if (examSource && bank.meta?.source) {
      console.log(`${schoolId}/${file}: source metadata set`);
    }
  }
}

console.log(`Done. ${distractorCount} questions got distractors, ${sourceCount} banks got source metadata.`);
