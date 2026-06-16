/**
 * Runs before `next build` on Vercel (via package.json "vercel-build").
 * Syncs committed bank JSON + figures into Neon when DATABASE_URL is set.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [script], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

if (!process.env.DATABASE_URL) {
  console.log(
    "[vercel-prepare] DATABASE_URL not set — skipping db:migrate and db:sync-figures"
  );
  process.exit(0);
}

try {
  console.log("[vercel-prepare] Pruning ineligible questions from bank JSON…");
  await run("scripts/prune-ineligible-questions.mjs");

  console.log("[vercel-prepare] Migrating banks to Neon…");
  await run("scripts/migrate-banks-to-neon.mjs");

  console.log("[vercel-prepare] Syncing figure images to Neon…");
  await run("scripts/sync-figure-images.mjs");

  console.log("[vercel-prepare] Database sync complete.");
} catch (error) {
  console.error("[vercel-prepare] Failed:", error);
  process.exit(1);
}
