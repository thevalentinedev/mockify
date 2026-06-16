/**
 * Sync figure imageData from local JSON + assets into Neon.
 * Run: DATABASE_URL=... node scripts/sync-figure-images.mjs [subject]
 * On Vercel, DATABASE_URL is injected by the platform (no .env file).
 */
import { readFile, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sql = neon(process.env.DATABASE_URL);

async function loadBank(schoolId, subjectId) {
  const jsonPath = path.join(root, "data/banks", schoolId, `${subjectId}.json`);
  return JSON.parse(await readFile(jsonPath, "utf-8"));
}

async function syncSubject(schoolId, subjectId) {
  const bank = await loadBank(schoolId, subjectId);
  const assetsDir = path.join(root, "data/assets", schoolId, subjectId);

  let attached = 0;
  for (const [key, ctx] of Object.entries(bank.contexts ?? {})) {
    if (ctx.imageData?.startsWith("data:image")) continue;
    const file = path.join(assetsDir, `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`);
    try {
      const buf = await readFile(file);
      bank.contexts[key] = {
        ...ctx,
        imageData: `data:image/png;base64,${buf.toString("base64")}`,
      };
      attached++;
    } catch {
      // no local asset
    }
  }

  await sql`
    INSERT INTO question_banks (school_id, subject_id, data, updated_at)
    VALUES (${schoolId}, ${subjectId}, ${JSON.stringify(bank)}::jsonb, NOW())
    ON CONFLICT (school_id, subject_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;

  console.log(`${subjectId}: synced ${attached} figure(s) to Neon`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL required");
  }

  const subjectArg = process.argv[2];
  const subjects = subjectArg
    ? [subjectArg]
    : (await readdir(path.join(root, "data/banks/conestoga"))).filter((f) =>
        f.endsWith(".json")
      ).map((f) => f.replace(".json", ""));

  for (const subjectId of subjects) {
    await syncSubject("conestoga", subjectId);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
