import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import path from "path";
import {
  getBankFromDb,
  listBanksFromDb,
  saveBankToDb,
} from "@/lib/bank-store";
import { isDbEnabled } from "@/lib/db";
import { ensureContextImagesPersisted } from "@/lib/blob-assets";
import { getBankPath, getBanksDir } from "@/lib/paths";
import type { QuestionBank, SchoolId, SubjectId } from "@/types/exam";

/** Loads question bank — Neon DB when configured, else local JSON files */
export async function getQuestionBank(
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<QuestionBank | null> {
  if (isDbEnabled()) {
    const bank = await getBankFromDb(schoolId, subjectId);
    if (bank) return bank;
  }

  const jsonPath = getBankPath(schoolId, subjectId);

  try {
    const raw = await readFile(jsonPath, "utf-8");
    return JSON.parse(raw) as QuestionBank;
  } catch {
    return null;
  }
}

function shouldMirrorToJson(): boolean {
  // Vercel's filesystem is read-only except /tmp — skip JSON mirror in production
  if (process.env.VERCEL) return false;
  return true;
}

export async function saveQuestionBank(bank: QuestionBank): Promise<void> {
  const persisted = await ensureContextImagesPersisted(bank);
  if (isDbEnabled()) {
    await saveBankToDb(persisted);
  }

  if (!shouldMirrorToJson()) return;

  const dir = getBanksDir(persisted.schoolId);
  await mkdir(dir, { recursive: true });
  await writeFile(
    getBankPath(persisted.schoolId, persisted.subjectId),
    JSON.stringify(persisted, null, 2)
  );
}

export async function listSavedBanks(schoolId: SchoolId): Promise<SubjectId[]> {
  if (isDbEnabled()) {
    const fromDb = await listBanksFromDb(schoolId);
    if (fromDb.length > 0) return fromDb;
  }

  const dir = getBanksDir(schoolId);

  try {
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.basename(f, ".json") as SubjectId);
  } catch {
    return [];
  }
}
