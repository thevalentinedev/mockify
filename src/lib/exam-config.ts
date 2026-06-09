import type { ModeConfig, School, SchoolId, Subject, SubjectExamConfig, SubjectId } from "@/types/exam";

/** Official Conestoga pre-assessment exam specs */
export const CONESTOGA_EXAM_SPECS: Record<SubjectId, SubjectExamConfig> = {
  english: { questionCount: 108, timeLimitMinutes: 110 },
  maths: { questionCount: 100, timeLimitMinutes: 120 },
  biology: { questionCount: 30, timeLimitMinutes: 50 },
  chemistry: { questionCount: 31, timeLimitMinutes: 60 },
};

export function getExamSpec(
  schoolId: SchoolId,
  subjectId: SubjectId
): SubjectExamConfig | null {
  if (schoolId === "conestoga") {
    return CONESTOGA_EXAM_SPECS[subjectId];
  }
  return null;
}

export const SCHOOLS: School[] = [
  {
    id: "conestoga",
    name: "Conestoga College",
    description: "Pre-assessment practice for Conestoga entrance exams",
    available: true,
  },
];

export const SUBJECTS: Subject[] = [
  {
    id: "english",
    name: "English",
    icon: "BookOpen",
    color: "from-violet-500/20 to-purple-500/10",
    description: "Reading comprehension, grammar & writing",
  },
  {
    id: "maths",
    name: "Mathematics",
    icon: "Calculator",
    color: "from-blue-500/20 to-cyan-500/10",
    description: "Arithmetic, algebra & problem solving",
  },
  {
    id: "biology",
    name: "Biology",
    icon: "Dna",
    color: "from-emerald-500/20 to-green-500/10",
    description: "Cell biology, anatomy & life sciences",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "FlaskConical",
    color: "from-amber-500/20 to-orange-500/10",
    description: "Elements, reactions & chemical principles",
  },
];

export const QUICK_QUESTION_COUNT = 20;

/** Proportional time for quick mode — minimum 1 minute per subject */
export function computeQuickTimeMinutes(spec: SubjectExamConfig): number {
  return Math.max(
    1,
    Math.round(spec.timeLimitMinutes * (QUICK_QUESTION_COUNT / spec.questionCount))
  );
}

export function modeHasTimer(
  mode: ModeConfig["id"],
  customTimeLimitMinutes?: number
): boolean {
  switch (mode) {
    case "mock":
    case "quick":
      return true;
    case "custom":
      return (customTimeLimitMinutes ?? 0) > 0;
    default:
      return false;
  }
}

export function getModeQuestionCount(
  mode: ModeConfig["id"],
  spec: SubjectExamConfig,
  overrides?: { customQuestionCount?: number; quickQuestionCount?: number }
): number {
  switch (mode) {
    case "quick":
      return overrides?.quickQuestionCount ?? QUICK_QUESTION_COUNT;
    case "custom":
      return overrides?.customQuestionCount ?? QUICK_QUESTION_COUNT;
    default:
      return spec.questionCount;
  }
}

export function getModeTimeLimitMinutes(
  mode: ModeConfig["id"],
  spec: SubjectExamConfig,
  overrides?: { customTimeLimitMinutes?: number; quickTimeLimitMinutes?: number }
): number | null {
  switch (mode) {
    case "mock":
      return spec.timeLimitMinutes;
    case "quick":
      return overrides?.quickTimeLimitMinutes ?? computeQuickTimeMinutes(spec);
    case "custom": {
      const minutes = overrides?.customTimeLimitMinutes ?? 0;
      return minutes > 0 ? minutes : null;
    }
    default:
      return null;
  }
}

export function getModeStartLabel(mode: ModeConfig["id"]): string {
  switch (mode) {
    case "mock":
      return "Mock Exam";
    case "quick":
      return "Quick Exam";
    case "custom":
      return "Custom Exam";
    default:
      return "Practice";
  }
}

export const MODES: ModeConfig[] = [
  {
    id: "practice",
    name: "Practice",
    description: "Real exam question count, no timer. Questions drawn from the practice pool.",
    timeLimit: false,
  },
  {
    id: "mock",
    name: "Mock Exam",
    description: "Same question count & time limit as the real exam. Timed simulation.",
    timeLimit: true,
  },
  {
    id: "quick",
    name: "Quick",
    description: "20 questions (per subject or split across subjects) with scaled time.",
    timeLimit: true,
  },
  {
    id: "custom",
    name: "Custom",
    description: "Set question count and time per subject.",
    timeLimit: false,
  },
];

export const SETUP_STEPS = ["school", "subjects", "mode"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];
