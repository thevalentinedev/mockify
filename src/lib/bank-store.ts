import { getDb } from "@/lib/db";
import type { QuestionBank, SchoolId, SubjectId } from "@/types/exam";

export async function getBankFromDb(
  schoolId: SchoolId,
  subjectId: SubjectId
): Promise<QuestionBank | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = (await sql`
    SELECT data FROM question_banks
    WHERE school_id = ${schoolId} AND subject_id = ${subjectId}
    LIMIT 1
  `) as { data: QuestionBank }[];

  if (!rows.length) return null;
  return rows[0].data;
}

/** Persists full bank JSONB — includes per-question explanation + wrongAnswerHints */
export async function saveBankToDb(bank: QuestionBank): Promise<void> {
  const sql = getDb();
  if (!sql) throw new Error("DATABASE_URL is not configured");

  await sql`
    INSERT INTO question_banks (school_id, subject_id, data, updated_at)
    VALUES (${bank.schoolId}, ${bank.subjectId}, ${JSON.stringify(bank)}, now())
    ON CONFLICT (school_id, subject_id)
    DO UPDATE SET data = ${JSON.stringify(bank)}, updated_at = now()
  `;
}

export async function listBanksFromDb(schoolId: SchoolId): Promise<SubjectId[]> {
  const sql = getDb();
  if (!sql) return [];

  const rows = await sql`
    SELECT subject_id FROM question_banks WHERE school_id = ${schoolId}
  `;

  return rows.map((r) => r.subject_id as SubjectId);
}
