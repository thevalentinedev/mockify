/**
 * Audit question banks for missing/broken context links.
 * Exit 1 when errors are found (broken contextId references).
 *
 * Usage: node scripts/audit-question-contexts.mjs
 */
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const banksDir = path.join(root, "data/banks/conestoga");

const PASSAGE_HINT =
  /\b(according to|in the (story|poem|passage|notice|chart|table|graph)|figure\s+\d+|the story|the poet|the passage|the notice|in figure)\b/i;

function auditBank(bank, file) {
  const errors = [];
  const warnings = [];
  const contexts = bank.contexts ?? {};

  for (const question of bank.questions ?? []) {
    const label = `${file} ${question.id}`;

    if (question.contextId && !contexts[question.contextId]) {
      errors.push(`${label}: contextId "${question.contextId}" not found in bank.contexts`);
    }

    if (!question.contextId && PASSAGE_HINT.test(question.text ?? "")) {
      warnings.push(`${label}: text looks context-dependent but has no contextId`);
    }
  }

  for (const contextId of Object.keys(contexts)) {
    const used = bank.questions?.some((q) => q.contextId === contextId);
    if (!used) {
      warnings.push(`${file}: context "${contextId}" is never referenced`);
    }
  }

  return { errors, warnings };
}

const files = (await readdir(banksDir)).filter((f) => f.endsWith(".json"));
let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  const bank = JSON.parse(await readFile(path.join(banksDir, file), "utf-8"));
  const { errors, warnings } = auditBank(bank, file);
  totalErrors += errors.length;
  totalWarnings += warnings.length;

  if (errors.length || warnings.length) {
    console.log(`\n${file}:`);
    for (const msg of errors) console.error(`  ERROR   ${msg}`);
    for (const msg of warnings) console.warn(`  WARN    ${msg}`);
  }
}

if (totalErrors === 0 && totalWarnings === 0) {
  console.log("All banks passed context audit.");
} else {
  console.log(`\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);
}

if (totalErrors > 0) process.exit(1);
