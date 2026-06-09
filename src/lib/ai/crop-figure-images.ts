import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai/model";

const cropSchema = z.object({
  figures: z.array(
    z.object({
      label: z.string(),
      topPercent: z.number().min(0).max(100),
      leftPercent: z.number().min(0).max(100),
      widthPercent: z.number().min(1).max(100),
      heightPercent: z.number().min(1).max(100),
    })
  ),
});

export interface FigureCrop {
  label: string;
  topPercent: number;
  leftPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export async function detectFigureCrops(
  imageDataUrl: string,
  figureLabels: string[]
): Promise<FigureCrop[]> {
  if (!figureLabels.length) return [];

  const { output } = await generateText({
    model: openai(AI_MODEL),
    output: Output.object({ schema: cropSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageDataUrl,
          },
          {
            type: "text",
            text: `This image is from an exam PDF and may contain one or more labelled figures/diagrams.

Find bounding boxes for each of these labels: ${figureLabels.join(", ")}

Return crop regions as percentages of the full image (0-100):
- topPercent: distance from top edge to crop top
- leftPercent: distance from left edge to crop left
- widthPercent / heightPercent: size of the crop box

Include every listed label that appears in the image. If a label is not visible, omit it.
Tight crops around each diagram — include axis labels and figure titles but not neighbouring figures.`,
          },
        ],
      },
    ],
  });

  if (!output?.figures.length) return [];

  const wanted = new Set(figureLabels.map((l) => l.toLowerCase()));
  return output.figures.filter((f) => wanted.has(f.label.toLowerCase()));
}
