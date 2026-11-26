import {
  startOrResumeTryoutUseCase,
  getExamSheetUseCase,
  saveExamAnswersUseCase,
  recordExamViolationUseCase,
  submitTryoutUseCase,
  getExamResultUseCase,
  getAttemptHistoryUseCase,
} from "@/core/container";
import { ViolationType } from "@/core/domain/entities/tryout.entity";
import { Role } from "@prisma/client";

export async function startOrResumeAttempt(
  userId: string,
  userRole: Role = Role.USER,
  tryoutId?: string
) {
  return await startOrResumeTryoutUseCase.execute(userId, userRole, tryoutId);
}

export async function getAttemptForExam(userId: string, attemptId: string) {
  return await getExamSheetUseCase.execute(userId, attemptId);
}

export async function saveAnswers(
  userId: string,
  attemptId: string,
  answers: { statementId: string; answer: boolean }[]
) {
  return await saveExamAnswersUseCase.execute(userId, attemptId, answers);
}

export async function recordViolation(
  userId: string,
  attemptId: string,
  type: ViolationType,
  detail?: string
) {
  return await recordExamViolationUseCase.execute(userId, attemptId, type, detail);
}

export async function submitAttempt(userId: string, attemptId: string) {
  return await submitTryoutUseCase.execute(userId, attemptId);
}

export async function getAttemptResult(userId: string, attemptId: string, userRole: Role = Role.USER) {
  return await getExamResultUseCase.execute(userId, attemptId, userRole);
}

export async function getUserAttemptHistory(userId: string) {
  return await getAttemptHistoryUseCase.execute(userId);
}
