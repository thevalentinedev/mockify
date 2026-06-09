/** Fisher-Yates shuffle — returns a new array */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function shuffleQuestionOptions(
  options: string[],
  correctIndex: number
): {
  options: string[];
  correctIndex: number;
  /** Maps original option index → new position after shuffle */
  indexMap: number[];
} {
  const indexed = options.map((option, index) => ({ option, index }));
  const shuffled = shuffle(indexed);
  const indexMap = shuffled.map((item) => item.index);

  return {
    options: shuffled.map((item) => item.option),
    correctIndex: shuffled.findIndex((item) => item.index === correctIndex),
    indexMap,
  };
}

export function remapWrongAnswerHints(
  hints: Record<string, string>,
  indexMap: number[],
  newCorrectIndex: number
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [oldKey, hint] of Object.entries(hints)) {
    const oldIdx = parseInt(oldKey, 10);
    const newIdx = indexMap.indexOf(oldIdx);
    if (newIdx >= 0 && newIdx !== newCorrectIndex) {
      result[String(newIdx)] = hint;
    }
  }

  return result;
}
