export type ScoreTone = "celebration" | "encouragement" | "growth";

export interface ScoreMessage {
  title: string;
  subtitle: string;
  tone: ScoreTone;
}

const CORRECT_PHRASES = [
  "Nice one!",
  "You got it!",
  "Spot on!",
  "Brilliant!",
  "Crushed it!",
  "That's the one!",
] as const;

const INCORRECT_PHRASES = [
  "Not quite — let's walk through it.",
  "Close! Here's how to nail it next time.",
  "Good try — this one's a great learning moment.",
  "Almost there — let's break it down together.",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickFrom<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

export function getScoreMessage(
  correct: number,
  total: number,
  percentage: number
): ScoreMessage {
  if (percentage >= 90) {
    return {
      title: "Outstanding!",
      subtitle: `You nailed ${correct} of ${total}. That's serious progress.`,
      tone: "celebration",
    };
  }
  if (percentage >= 70) {
    return {
      title: "Great session!",
      subtitle: `${correct} of ${total} correct — you're building real momentum.`,
      tone: "celebration",
    };
  }
  if (percentage >= 50) {
    return {
      title: "Solid effort!",
      subtitle: `${correct} right. The review below is your power-up for next time.`,
      tone: "encouragement",
    };
  }
  if (percentage >= 30) {
    return {
      title: "You showed up!",
      subtitle: `${correct} correct. Every question you review makes the next attempt stronger.`,
      tone: "growth",
    };
  }
  return {
    title: "Session complete!",
    subtitle: "Finishing counts. Use the walkthroughs below — you've got this.",
    tone: "growth",
  };
}

export function scoreRingClass(percentage: number): string {
  if (percentage >= 70) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (percentage >= 50) {
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  }
  return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
}

export function getCorrectPhrase(seed: string): string {
  return pickFrom(CORRECT_PHRASES, seed);
}

export function getIncorrectPhrase(seed: string): string {
  return pickFrom(INCORRECT_PHRASES, seed);
}

export function remediationLabel(isTextInput: boolean): string {
  return isTextInput ? "Here's the nuance: " : "Common mix-up: ";
}

export function insightSectionTitle(isCorrect: boolean): string {
  return isCorrect ? "Why this works" : "Let's unpack this";
}

export function solutionLabel(isCorrect: boolean): string {
  return isCorrect ? "How we got there" : "Walkthrough";
}

export function practiceFocusHeading(usingObjectives: boolean): string {
  return usingObjectives ? "Skills to level up" : "Topics to level up";
}

export const answerFeedback = {
  correct:
    "rounded-[var(--radius-surface)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  incorrect:
    "rounded-[var(--radius-surface)] bg-violet-500/10 text-violet-800 dark:text-violet-300",
  incorrectBorder: "border-violet-500/35 bg-violet-500/10",
  correctBorder: "border-emerald-500/40 bg-emerald-500/10",
  growthPanel: "bg-amber-500/10",
  celebratePanel: "bg-emerald-500/10",
} as const;
