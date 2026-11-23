import {
  TryoutEntity,
  AttemptEntity,
  ExamSheet,
  ExamResult,
} from "../entities/tryout.entity";

export interface ITryoutRepository {
  findPublishedTryout(): Promise<TryoutEntity | null>;
  findActiveAttempt(userId: string, tryoutId: string): Promise<AttemptEntity | null>;
  findAttemptById(attemptId: string): Promise<AttemptEntity | null>;
  createAttempt(data: { userId: string; tryoutId: string; isTest?: boolean }): Promise<AttemptEntity>;
  getExamSheet(attemptId: string, userId: string): Promise<ExamSheet | null>;
  saveAnswers(attemptId: string, answers: { statementId: string; answer: boolean }[]): Promise<number>;
  submitAttempt(attemptId: string, userId: string): Promise<{ attemptId: string; score: number; max: number; percent: number }>;
  getExamResult(attemptId: string, userId: string, isAdmin?: boolean): Promise<ExamResult | null>;
  findUserAttemptHistory(userId: string): Promise<{
    id: string;
    tryoutTitle: string;
    startedAt: Date;
    submittedAt: Date | null;
    durationSeconds: number;
    score: number;
    maxScore: number;
    percent: number;
  }[]>;
  getSubmittedAttemptsStats(): Promise<{ count: number; avgScore: number }>;
}
