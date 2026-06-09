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

export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface PdfEmbeddedImage {
  pageNumber: number;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PdfPageScreenshot {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PdfExtractBundle {
  text: string;
  pageTexts: PdfPageText[];
  images: PdfEmbeddedImage[];
}

export async function openPdfParser(filePath: string): Promise<PDFParse> {
  ensurePdfWorker();
  const buffer = await readFile(filePath);
  return new PDFParse({ data: buffer });
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const parser = await openPdfParser(filePath);
  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error(
        "No text found in PDF. It may be a scanned image — try a text-based PDF sample."
      );
    }

    if (text.length > MAX_CHARS) {
      return `${text.slice(0, MAX_CHARS)}\n\n[... truncated for processing ...]`;
    }

    return text;
  } finally {
    await parser.destroy();
  }
}

export async function extractPdfBundle(filePath: string): Promise<PdfExtractBundle> {
  const parser = await openPdfParser(filePath);
  try {
    const textResult = await parser.getText();
    const pageTexts: PdfPageText[] = (textResult.pages ?? []).map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));

    let text = textResult.text.trim();
    if (!text) {
      throw new Error(
        "No text found in PDF. It may be a scanned image — try a text-based PDF sample."
      );
    }
    if (text.length > MAX_CHARS) {
      text = `${text.slice(0, MAX_CHARS)}\n\n[... truncated for processing ...]`;
    }

    const imageResult = await parser.getImage({ imageThreshold: 50 });
    const images: PdfEmbeddedImage[] = [];
    for (const page of imageResult.pages) {
      for (const image of page.images ?? []) {
        if (!image.dataUrl) continue;
        images.push({
          pageNumber: page.pageNumber,
          name: image.name,
          dataUrl: image.dataUrl,
          width: image.width,
          height: image.height,
        });
      }
    }

    return { text, pageTexts, images };
  } finally {
    await parser.destroy();
  }
}

export async function extractPageScreenshots(
  filePath: string,
  pageNumbers: number[],
  scale = 1.5
): Promise<PdfPageScreenshot[]> {
  if (!pageNumbers.length) return [];

  const parser = await openPdfParser(filePath);
  try {
    const shots = await parser.getScreenshot({ partial: pageNumbers, scale });
    return (shots.pages ?? [])
      .filter((page) => page.dataUrl)
      .map((page) => ({
        pageNumber: page.pageNumber,
        dataUrl: page.dataUrl,
        width: page.width,
        height: page.height,
      }));
  } finally {
    await parser.destroy();
  }
}
