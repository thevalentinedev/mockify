export type SchoolId = "conestoga";

export type SubjectId = "english" | "maths" | "biology" | "chemistry";

export type ExamMode = "practice" | "mock";

export type QuestionSource = "sample" | "generated" | "verified";

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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  /** Why each wrong option is incorrect — keyed by option index */
  wrongAnswerHints?: Record<string, string>;
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
}

export interface ExamSession {
  schoolId: SchoolId;
  subjects: SubjectId[];
  mode: ExamMode;
  questions: ShuffledQuestion[];
  timeLimitMinutes: number | null;
  startedAt: number;
}

export interface ExamAnswer {
  questionId: string;
  selectedIndex: number | null;
}

export interface ExamProgress {
  startedAt: number;
  currentIndex: number;
  answers: ExamAnswer[];
  showReview: boolean;
  updatedAt: number;
}

export interface ExamResult {
  session: ExamSession;
  answers: ExamAnswer[];
  completedAt: number;
}
