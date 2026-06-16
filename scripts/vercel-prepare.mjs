/**
 * Neon sync step for Vercel builds (runs after banks:patch-pdf).
 *
 * When DATABASE_URL is set:
 *   npm run banks:prune
 *   npm run db:migrate
 *   npm run db:sync-figures
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function runNode(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [script], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`node ${script} exited with code ${code}`));
    });
  });
}

function runNpm(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run ${script} exited with code ${code}`));
    });
  });
}

if (!process.env.DATABASE_URL) {
  console.log(
    "[vercel-prepare] DATABASE_URL not set — skipping banks:prune, db:migrate, db:sync-figures"
  );
  process.exit(0);
}

try {
  console.log("[vercel-prepare] Pruning ineligible questions from bank JSON…");
  await runNpm("banks:prune");

  console.log("[vercel-prepare] Migrating banks to Neon…");
  await runNpm("db:migrate");

  console.log("[vercel-prepare] Syncing figure images to Neon…");
  await runNode("scripts/sync-figure-images.mjs");

  console.log("[vercel-prepare] Database sync complete.");
} catch (error) {
  console.error("[vercel-prepare] Failed:", error);
  process.exit(1);
}
