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

export interface AttemptEntity {
  id: string;
  userId: string;
  tryoutId: string;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt?: Date | null;
  score?: number | null;
  isTest: boolean;
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
  questions: ExamSheetQuestion[];
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
