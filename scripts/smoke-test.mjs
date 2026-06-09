import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function main() {
  const mathsPath = path.join(root, "data/banks/conestoga/maths.json");
  const raw = await readFile(mathsPath, "utf-8");
  const bank = JSON.parse(raw);

  if (!bank.questions?.length) {
    throw new Error("maths bank has no questions");
  }

  const contexts = bank.contexts ?? {};
  const withImages = Object.values(contexts).filter(
    (c) => c.imageData || c.imagePath
  ).length;

  console.log(
    JSON.stringify({
      ok: true,
      questions: bank.questions.length,
      contexts: Object.keys(contexts).length,
      contextsWithImages: withImages,
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
