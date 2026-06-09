/**
 * One-time migration: local JSON banks → Neon
 * Usage: DATABASE_URL=postgres://... node scripts/migrate-banks-to-neon.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const banksDir = path.join(root, "data/banks/conestoga");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL first");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS question_banks (
    school_id   TEXT NOT NULL,
    subject_id  TEXT NOT NULL,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, subject_id)
  )
`;

const files = await readdir(banksDir);
for (const file of files.filter((f) => f.endsWith(".json"))) {
  const subjectId = file.replace(".json", "");
  const raw = await readFile(path.join(banksDir, file), "utf-8");
  await sql`
    INSERT INTO question_banks (school_id, subject_id, data, updated_at)
    VALUES ('conestoga', ${subjectId}, ${raw}::jsonb, now())
    ON CONFLICT (school_id, subject_id)
    DO UPDATE SET data = ${raw}::jsonb, updated_at = now()
  `;
  console.log(`Migrated conestoga/${subjectId}`);
}

console.log("Done.");
