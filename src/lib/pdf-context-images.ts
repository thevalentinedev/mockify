import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { detectFigureCrops } from "@/lib/ai/crop-figure-images";
import { contextsNeedingImages, PLACEHOLDER_RE } from "@/lib/bank-image-needs";
import { getAssetFilePath, getAssetsDir } from "@/lib/paths";
import {
  extractPageScreenshots,
  extractPdfBundle,
  type PdfEmbeddedImage,
  type PdfPageText,
} from "@/lib/pdf-extract";
import type { QuestionBank } from "@/types/exam";

function normalizeFigureLabel(title?: string, id?: string): string | null {
  const source = title ?? id ?? "";
  const match = source.match(/figure\s*(\d+)/i);
  if (match) return `Figure ${match[1]}`;
  if (title?.trim()) return title.trim();
  return null;
}

function mapFiguresToPages(pageTexts: PdfPageText[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const page of pageTexts) {
    const matches = page.text.matchAll(/Figure\s+(\d+)/gi);
    for (const match of matches) {
      map.set(`Figure ${match[1]}`, page.pageNumber);
    }
  }

  return map;
}

function pickPageImage(
  pageNumber: number,
  embedded: PdfEmbeddedImage[],
  screenshots: Map<number, string>
): string | null {
  const pageEmbedded = embedded.filter((img) => img.pageNumber === pageNumber);
  if (pageEmbedded.length === 1) return pageEmbedded[0].dataUrl;
  if (pageEmbedded.length > 1) {
    return pageEmbedded.sort((a, b) => b.height * b.width - a.height * a.width)[0]
      .dataUrl;
  }
  return screenshots.get(pageNumber) ?? null;
}

async function cropAndSave(
  imageDataUrl: string,
  crop: {
    topPercent: number;
    leftPercent: number;
    widthPercent: number;
    heightPercent: number;
  },
  outputPath: string
): Promise<string> {
  const base64 = imageDataUrl.split(",")[1];
  const input = Buffer.from(base64, "base64");
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;

  const left = Math.max(0, Math.round((crop.leftPercent / 100) * width));
  const top = Math.max(0, Math.round((crop.topPercent / 100) * height));
  const cropWidth = Math.min(
    width - left,
    Math.max(1, Math.round((crop.widthPercent / 100) * width))
  );
  const cropHeight = Math.min(
    height - top,
    Math.max(1, Math.round((crop.heightPercent / 100) * height))
  );

  const cropped = await sharp(input)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  await writeFile(outputPath, cropped);
  return `data:image/png;base64,${cropped.toString("base64")}`;
}

function contextFilename(contextId: string): string {
  return `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
}

export async function attachPdfImagesToBank(
  bank: QuestionBank,
  pdfPath: string
): Promise<{ bank: QuestionBank; attached: number }> {
  const pending = contextsNeedingImages(bank);
  if (!pending.length) return { bank, attached: 0 };

  const bundle = await extractPdfBundle(pdfPath);
  const figurePages = mapFiguresToPages(bundle.pageTexts);

  const pagesNeeded = new Set<number>();
  const pageToLabels = new Map<number, string[]>();

  for (const ctx of pending) {
    const label = normalizeFigureLabel(ctx.title, ctx.id);
    if (!label) continue;
    const pageNumber = figurePages.get(label);
    if (!pageNumber) continue;
    pagesNeeded.add(pageNumber);
    const labels = pageToLabels.get(pageNumber) ?? [];
    labels.push(label);
    pageToLabels.set(pageNumber, labels);
  }

  if (!pagesNeeded.size) return { bank, attached: 0 };

  const screenshots = await extractPageScreenshots(pdfPath, [...pagesNeeded]);
  const screenshotMap = new Map(
    screenshots.map((shot) => [shot.pageNumber, shot.dataUrl])
  );

  await mkdir(getAssetsDir(bank.schoolId, bank.subjectId), { recursive: true });

  const contexts = { ...bank.contexts };
  let attached = 0;

  for (const [pageNumber, labels] of pageToLabels) {
    const sourceImage = pickPageImage(pageNumber, bundle.images, screenshotMap);
    if (!sourceImage) continue;

    const uniqueLabels = [...new Set(labels)];
    let crops = await detectFigureCrops(sourceImage, uniqueLabels);

    if (!crops.length && uniqueLabels.length === 1) {
      crops = [
        {
          label: uniqueLabels[0],
          topPercent: 0,
          leftPercent: 0,
          widthPercent: 100,
          heightPercent: 100,
        },
      ];
    }

    for (const label of uniqueLabels) {
      const contextEntry = Object.entries(contexts).find(
        ([, ctx]) => normalizeFigureLabel(ctx.title, ctx.id) === label
      );
      if (!contextEntry) continue;

      const [contextKey, ctx] = contextEntry;
      const crop = crops.find((c) => c.label.toLowerCase() === label.toLowerCase());
      const filename = contextFilename(contextKey);
      const filePath = getAssetFilePath(bank.schoolId, bank.subjectId, filename);
      const relativePath = path.join(bank.schoolId, bank.subjectId, filename);

      try {
        const imageData = crop
          ? await cropAndSave(sourceImage, crop, filePath)
          : await cropAndSave(
              sourceImage,
              { topPercent: 0, leftPercent: 0, widthPercent: 100, heightPercent: 100 },
              filePath
            );

        contexts[contextKey] = {
          ...ctx,
          imageData,
          imagePath: relativePath,
          content:
            ctx.content && !PLACEHOLDER_RE.test(ctx.content)
              ? ctx.content
              : `${label} from the exam PDF.`,
        };
        attached++;
      } catch {
        // Skip figures we cannot crop
      }
    }
  }

  return {
    bank: {
      ...bank,
      contexts,
    },
    attached,
  };
}

export { bankNeedsImageExtraction } from "@/lib/bank-image-needs";
