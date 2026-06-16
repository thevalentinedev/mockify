/**
 * Merge verified PDF patch fields into an existing question without dropping
 * enrichment (solution steps, distractors, questionType).
 */
export function mergePatchQuestion(existing, patch) {
  if (!existing) return { ...patch };

  const merged = {
    ...existing,
    ...patch,
    meta: {
      ...existing.meta,
      ...patch.meta,
    },
  };

  if (patch.contextId === undefined && existing.contextId) {
    merged.contextId = existing.contextId;
  }

  if (!patch.solution && existing.solution) merged.solution = existing.solution;
  if (!patch.distractors?.length && existing.distractors?.length) {
    merged.distractors = existing.distractors;
  }
  if (!patch.questionType && existing.questionType) {
    merged.questionType = existing.questionType;
  }

  return merged;
}
