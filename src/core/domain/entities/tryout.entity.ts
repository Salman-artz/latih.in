export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED";

export interface StatementEntity {
  id: string;
  questionId: string;
  order: number;
  text: string;
  isTrue: boolean;
  explanation: string;
}

export interface QuestionEntity {
  id: string;
  tryoutId: string;
  order: number;
  stem: string;
  statements: StatementEntity[];
}

export interface TryoutEntity {
  id: string;
  title: string;
  durationMinutes: number;
  status: "DRAFT" | "PUBLISHED";
  questions?: QuestionEntity[];
}

export type ViolationType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "EXIT_FULLSCREEN"
  | "SPLIT_SCREEN"
  | "DEVTOOLS_OR_PRINT"
  | "COPY_ATTEMPT";

export interface AttemptEntity {
  id: string;
  userId: string;
  tryoutId: string;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt?: Date | null;
  score?: number | null;
  isTest: boolean;
  violationCount: number;
}

export interface ExamSheetStatement {
  id: string;
  order: number;
  text: string;
  userAnswer: boolean | null;
}

export interface ExamSheetQuestion {
  id: string;
  order: number;
  stem: string;
  statements: ExamSheetStatement[];
}

export interface ExamSheet {
  attemptId: string;
  tryoutTitle: string;
  startedAt: Date;
  durationMinutes: number;
  remainingSeconds: number;
  violationCount: number;
  maxViolations: number;
  participant: {
    id: string;
    name: string;
    email: string;
  };
  questions: ExamSheetQuestion[];
}

export interface RecordViolationResult {
  violationCount: number;
  maxViolations: number;
  autoSubmitted: boolean;
  scoreResult?: {
    attemptId: string;
    score: number;
    max: number;
    percent: number;
  };
}

export interface ExamResultStatement {
  id: string;
  order: number;
  text: string;
  userAnswer: boolean | null;
  isTrue: boolean;
  isCorrect: boolean;
  explanation: string;
}

export interface ExamResultQuestion {
  id: string;
  order: number;
  stem: string;
  correctCount: number;
  statements: ExamResultStatement[];
}

export interface ExamResult {
  attemptId: string;
  tryoutTitle: string;
  startedAt: Date;
  submittedAt: Date | null;
  durationSeconds: number;
  score: number;
  maxScore: number;
  percent: number;
  questions: ExamResultQuestion[];
}
