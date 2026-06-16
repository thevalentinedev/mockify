export type SchoolId = "conestoga";

export type SubjectId = "english" | "maths" | "biology" | "chemistry";

export type ExamMode = "practice" | "mock" | "custom" | "study";

export interface SubjectCustomOptions {
  questionCount: number;
  /** 0 = no timer */
  timeLimitMinutes: number;
}

/** User-defined settings for custom mode (persisted on session) */
export interface ExamCustomOptions {
  perSubject: Partial<Record<SubjectId, SubjectCustomOptions>>;
}

export interface ExamBuildPreferences {
  /** Topics to prioritize in question selection (spaced repetition / weak-topic practice) */
  focusTopics?: string[];
  customPerSubject?: Partial<Record<SubjectId, SubjectCustomOptions>>;
}

export type QuestionSource = "sample" | "generated" | "verified" | "variant";

export type Difficulty = "easy" | "medium" | "hard";

export type AnswerConfidence = "high" | "medium" | "low";

export interface School {
  id: SchoolId;
  name: string;
  description: string;
  available: boolean;
}

export interface Subject {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface ModeConfig {
  id: ExamMode;
  name: string;
  description: string;
  timeLimit: boolean;
}

export interface QuestionMeta {
  topics: string[];
  difficulty?: Difficulty;
  source: QuestionSource;
  verifiedAt?: string;
  answerConfidence?: AnswerConfidence;
}

/** Passage, graph, table, etc. shown above the question */
export type QuestionContextType =
  | "passage"
  | "comprehension"
  | "graph"
  | "table"
  | "diagram"
  | "image";

export interface QuestionContext {
  id?: string;
  type: QuestionContextType;
  title?: string;
  content: string;
  /** Base64 data URL — persisted in bank JSON for deployment */
  imageData?: string;
  /** Relative asset path under data/assets/ — used locally when set */
  imagePath?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  /** Why each wrong option is incorrect — keyed by option index */
  wrongAnswerHints?: Record<string, string>;
  /** Inline reference material (passage, graph description, etc.) */
  context?: QuestionContext;
  /** Shared material — resolved from bank.contexts when set */
  contextId?: string;
  meta?: QuestionMeta;
}

export interface TopicWeight {
  topic: string;
  weight: number;
  questionCount: number;
}

export interface BankMeta {
  schoolContext?: string;
  topicsCovered: string[];
  examBlueprint: TopicWeight[];
  lastEnrichedAt?: string;
  lastGeneratedAt?: string;
  totalGenerated: number;
  /** How many exams have started using this bank */
  examStarts?: number;
  /** Last N exams — question ids used (for rotation away from repeats) */
  recentExamSets?: string[][];
  lastTwistedAt?: string;
  lastExamBuiltAt?: string;
}

export interface SubjectExamConfig {
  /** Real exam question count (from PDF sample) — used per attempt in both modes */
  questionCount: number;
  /** Real exam time limit in minutes (from PDF) — used in mock mode */
  timeLimitMinutes: number;
}

export interface QuestionBank {
  schoolId: SchoolId;
  subjectId: SubjectId;
  config: SubjectExamConfig;
  questions: Question[];
  /** Shared passages/graphs referenced by question contextId */
  contexts?: Record<string, QuestionContext>;
  meta?: BankMeta;
}

export interface ShuffledQuestion {
  id: string;
  originalId: string;
  subjectId: SubjectId;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  wrongAnswerHints?: Record<string, string>;
  topic?: string;
  context?: QuestionContext;
  contextKey?: string;
  answerConfidence?: AnswerConfidence;
}

export interface SubjectSection {
  subjectId: SubjectId;
  questions: ShuffledQuestion[];
  /** Per-subject timer in mock mode */
  timeLimitMinutes: number | null;
  startedAt: number;
  completedAt?: number;
}

export interface ExamSession {
  schoolId: SchoolId;
  subjects: SubjectId[];
  mode: ExamMode;
  sections: SubjectSection[];
  startedAt: number;
  /** Present when mode is "custom" */
  customOptions?: ExamCustomOptions;
  focusTopics?: string[];
  /** @deprecated Pre-sections format — migrated on load */
  questions?: ShuffledQuestion[];
  timeLimitMinutes?: number | null;
}

export interface ExamAnswer {
  questionId: string;
  selectedIndex: number | null;
}

export interface ExamProgress {
  startedAt: number;
  currentSubjectIndex: number;
  /** Index within the current subject section */
  currentIndex: number;
  answers: ExamAnswer[];
  showReview: boolean;
  completedSubjects: SubjectId[];
  flaggedQuestionIds: string[];
  /** Study mode — question ids where the student revealed the answer */
  revealedQuestionIds?: string[];
  /** ms spent per question id */
  questionTimeMs: Record<string, number>;
  /** when the student opened the current question */
  questionOpenedAt?: number;
  updatedAt: number;
}

export interface QuestionTimeStat {
  questionId: string;
  subjectId: SubjectId;
  index: number;
  timeMs: number;
}

export interface ExamResult {
  session: ExamSession;
  answers: ExamAnswer[];
  completedAt: number;
  timeStats?: QuestionTimeStat[];
}

export interface PrepareAuditEntry {
  subjectId: SubjectId;
  actions: string[];
}
