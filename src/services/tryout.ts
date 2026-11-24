import {
  startOrResumeTryoutUseCase,
  getExamSheetUseCase,
  saveExamAnswersUseCase,
  submitTryoutUseCase,
  getExamResultUseCase,
  getAttemptHistoryUseCase,
} from "@/core/container";
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

export async function submitAttempt(userId: string, attemptId: string) {
  return await submitTryoutUseCase.execute(userId, attemptId);
}

export async function getAttemptResult(userId: string, attemptId: string, userRole: Role = Role.USER) {
  return await getExamResultUseCase.execute(userId, attemptId, userRole);
}

export async function getUserAttemptHistory(userId: string) {
  return await getAttemptHistoryUseCase.execute(userId);
}
