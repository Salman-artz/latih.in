import { ITryoutRepository } from "@/core/domain/repositories/tryout.repository.interface";
import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { ViolationType } from "@/core/domain/entities/tryout.entity";
import { AppError } from "@/lib/errors";

export class StartOrResumeTryoutUseCase {
  constructor(
    private tryoutRepo: ITryoutRepository,
    private subRepo: ISubscriptionRepository
  ) {}

  async execute(userId: string, userRole = "USER", tryoutId?: string) {
    const tryout = await this.tryoutRepo.findPublishedTryout(tryoutId);
    if (!tryout) {
      throw new AppError("Paket tryout belum tersedia", 404, "TRYOUT_NOT_FOUND");
    }

    const isTest = userRole === "ADMIN";
    if (!isTest) {
      const sub = await this.subRepo.findActiveByUserId(userId, new Date(), tryout.id);
      if (!sub) {
        throw new AppError("Langganan aktif untuk paket tryout ini diperlukan", 403, "SUBSCRIPTION_REQUIRED");
      }
    }

    const activeAttempt = await this.tryoutRepo.findActiveAttempt(userId, tryout.id);
    if (activeAttempt) {
      const elapsedSeconds = Math.floor((Date.now() - activeAttempt.startedAt.getTime()) / 1000);
      const maxSeconds = tryout.durationMinutes * 60;

      if (elapsedSeconds >= maxSeconds) {
        await this.tryoutRepo.submitAttempt(activeAttempt.id, userId);
        throw new AppError("Waktu tryout telah habis, attempt telah disubmit otomatis", 400, "EXAM_EXPIRED");
      }

      return { attemptId: activeAttempt.id, isNew: false };
    }

    const newAttempt = await this.tryoutRepo.createAttempt({
      userId,
      tryoutId: tryout.id,
      isTest,
    });

    return { attemptId: newAttempt.id, isNew: true };
  }
}

export class GetExamSheetUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string, attemptId: string) {
    const sheet = await this.tryoutRepo.getExamSheet(attemptId, userId);
    if (!sheet) {
      throw new AppError("Attempt tryout tidak ditemukan", 404, "NOT_FOUND");
    }

    if (sheet.remainingSeconds <= 0) {
      await this.tryoutRepo.submitAttempt(attemptId, userId);
      throw new AppError("Waktu tryout telah habis, attempt telah disubmit otomatis", 400, "EXAM_EXPIRED");
    }

    return sheet;
  }
}

export class SaveExamAnswersUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string, attemptId: string, answers: { statementId: string; answer: boolean }[]) {
    const attempt = await this.tryoutRepo.findAttemptById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      throw new AppError("Attempt tidak ditemukan", 404, "NOT_FOUND");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new AppError("Attempt sudah disubmit dan tidak dapat diubah", 400, "ALREADY_SUBMITTED");
    }

    const saved = await this.tryoutRepo.saveAnswers(attemptId, answers);
    return { saved };
  }
}

export class RecordExamViolationUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string, attemptId: string, type: ViolationType, detail?: string) {
    const attempt = await this.tryoutRepo.findAttemptById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      throw new AppError("Attempt tidak ditemukan", 404, "NOT_FOUND");
    }

    return await this.tryoutRepo.recordViolation(attemptId, userId, type, detail, 5);
  }
}

export class SubmitTryoutUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string, attemptId: string) {
    const attempt = await this.tryoutRepo.findAttemptById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      throw new AppError("Attempt tidak ditemukan", 404, "NOT_FOUND");
    }
    if (attempt.status === "SUBMITTED") {
      throw new AppError("Attempt sudah pernah disubmit", 400, "ALREADY_SUBMITTED");
    }

    return await this.tryoutRepo.submitAttempt(attemptId, userId);
  }
}

export class GetExamResultUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string, attemptId: string, userRole = "USER") {
    const isAdmin = userRole === "ADMIN";
    const result = await this.tryoutRepo.getExamResult(attemptId, userId, isAdmin);
    if (!result) {
      throw new AppError("Hasil tryout tidak ditemukan", 404, "NOT_FOUND");
    }
    return result;
  }
}

export class GetAttemptHistoryUseCase {
  constructor(private tryoutRepo: ITryoutRepository) {}

  async execute(userId: string) {
    return await this.tryoutRepo.findUserAttemptHistory(userId);
  }
}
