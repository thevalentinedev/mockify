export type SchoolId = "conestoga";

export type SubjectId = "english" | "maths" | "biology" | "chemistry";

export type ExamMode = "practice" | "mock" | "custom" | "study";

/** Conestoga Math Skills Assessment program track */
export type MathsProgramId = "engineering" | "business" | "trades-health";

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
  /** Study mode — restrict each subject to selected topics (empty = all) */
  studyTopicsBySubject?: Partial<Record<SubjectId, string[]>>;
  customPerSubject?: Partial<Record<SubjectId, SubjectCustomOptions>>;
  /** Conestoga maths — which program track determines question range (1–72, 1–88, or 1–100) */
  mathsProgram?: MathsProgramId;
}

export type QuestionSource = "sample" | "generated" | "verified" | "variant";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type AnswerConfidence = "high" | "medium" | "low";

/** Institution / exam PDF provenance (bank-level meta.source) */
export interface ExamSourceMetadata {
  institution: string;
  exam: string;
  year: number | null;
}

export interface QuestionDistractor {
  answer: string;
  reason: string;
}

export interface QuestionSolution {
  steps: string[];
  finalAnswer?: string;
}

export type QuestionType =
  | "multiple_choice"
  | "multi_select"
  | "numeric"
  | "short_answer"
  | "essay"
  | "true_false";

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
  /** Compact search labels — easier to filter than long topic strings */
  tags?: string[];
  /** Specific skill tested — better for analytics than topics alone */
  learningObjective?: string;
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
  questionType?: QuestionType;
  options?: string[];
  correctIndex?: number;
  /** Primary correct answer for numeric questions */
  answer?: string;
  /** Alternate accepted forms (fractions, decimals, etc.) */
  acceptedAnswers?: string[];
  explanation?: string;
  /** Step-by-step worked solution — preferred over a single explanation string */
  solution?: QuestionSolution;
  /** Why each distractor exists — keyed by wrong answer text */
  distractors?: QuestionDistractor[];
  /** @deprecated Prefer distractors — keyed by option index */
  wrongAnswerHints?: Record<string, string>;
  /** Inline reference material (passage, graph description, etc.) */
  context?: QuestionContext;
  /** Shared material — resolved from bank.contexts when set */
  contextId?: string;
  /** Top-level alias — normalized into meta.learningObjective on load */
  learningObjective?: string;
  /** Top-level alias — normalized into meta.tags on load */
  tags?: string[];
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
  /** Institution / exam PDF provenance */
  source?: ExamSourceMetadata;
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
  questionType?: QuestionType;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  acceptedAnswers?: string[];
  explanation?: string;
  solution?: QuestionSolution;
  distractors?: QuestionDistractor[];
  wrongAnswerHints?: Record<string, string>;
  topic?: string;
  learningObjective?: string;
  tags?: string[];
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
  studyTopicsBySubject?: Partial<Record<SubjectId, string[]>>;
  /** Conestoga maths program track when maths is included */
  mathsProgram?: MathsProgramId;
  /** @deprecated Pre-sections format — migrated on load */
  questions?: ShuffledQuestion[];
  timeLimitMinutes?: number | null;
}

export interface ExamAnswer {
  questionId: string;
  selectedIndex: number | null;
  textAnswer?: string | null;
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
