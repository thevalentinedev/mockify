import { readFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";

const MAX_CHARS = 80_000;

let workerReady = false;

function ensurePdfWorker(): void {
  if (workerReady) return;
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
  );
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerReady = true;
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  ensurePdfWorker();
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error("No text found in PDF. It may be a scanned image — OCR is not supported yet.");
    }

    if (text.length > MAX_CHARS) {
      return `${text.slice(0, MAX_CHARS)}\n\n[... truncated for processing ...]`;
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
