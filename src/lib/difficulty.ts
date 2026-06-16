import { z } from "zod";
import type { Difficulty } from "@/types/exam";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "Very easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Very hard",
};

const LEGACY_DIFFICULTY: Record<string, Difficulty> = {
  very_easy: 1,
  veryeasy: 1,
  easy: 2,
  medium: 3,
  med: 3,
  hard: 4,
  very_hard: 5,
  veryhard: 5,
};

export function isDifficultyScore(value: number): value is Difficulty {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Coerce legacy string labels or numeric strings to a 1–5 difficulty score */
export function coerceDifficulty(value: unknown): Difficulty | undefined {
  if (typeof value === "number" && isDifficultyScore(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const asNumber = Number(trimmed);
    if (isDifficultyScore(asNumber)) return asNumber;

    const key = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
    return LEGACY_DIFFICULTY[key];
  }

  return undefined;
}

export function formatDifficultyLabel(score: Difficulty | undefined): string {
  if (!score) return "";
  return DIFFICULTY_LABELS[score];
}

export const difficultyZod = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const difficultySchema = {
  min: 1,
  max: 5,
} as const;
