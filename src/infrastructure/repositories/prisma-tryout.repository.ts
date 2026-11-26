import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ITryoutRepository } from "@/core/domain/repositories/tryout.repository.interface";
import {
  TryoutEntity,
  AttemptEntity,
  ExamSheet,
  ExamResult,
  AttemptStatus,
  ViolationType,
  RecordViolationResult,
} from "@/core/domain/entities/tryout.entity";

export class PrismaTryoutRepository implements ITryoutRepository {
  async findPublishedTryout(tryoutId?: string): Promise<TryoutEntity | null> {
    const where: Prisma.TryoutWhereInput = { status: "PUBLISHED" };
    if (tryoutId) {
      where.id = tryoutId;
    }
    const tryout = await prisma.tryout.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });
    if (!tryout) return null;
    return {
      ...tryout,
      status: tryout.status as "DRAFT" | "PUBLISHED",
    };
  }

  async findActiveAttempt(userId: string, tryoutId: string): Promise<AttemptEntity | null> {
    const att = await prisma.attempt.findFirst({
      where: { userId, tryoutId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
    });
    if (!att) return null;
    return {
      ...att,
      status: att.status as AttemptStatus,
    };
  }

  async findAttemptById(attemptId: string): Promise<AttemptEntity | null> {
    const att = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!att) return null;
    return {
      ...att,
      status: att.status as AttemptStatus,
    };
  }

  async createAttempt(data: { userId: string; tryoutId: string; isTest?: boolean }): Promise<AttemptEntity> {
    const att = await prisma.attempt.create({
      data: {
        userId: data.userId,
        tryoutId: data.tryoutId,
        status: "IN_PROGRESS",
        isTest: data.isTest || false,
      },
    });
    return {
      ...att,
      status: att.status as AttemptStatus,
    };
  }

  async getExamSheet(attemptId: string, userId: string): Promise<ExamSheet | null> {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tryout: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                statements: {
                  orderBy: { order: "asc" },
                  // KEAMANAN KRITIS: JANGAN PERNAH menyertakan isTrue atau explanation!
                  select: { id: true, order: true, text: true },
                },
              },
            },
          },
        },
        answers: { select: { statementId: true, answer: true } },
      },
    });

    if (!attempt || attempt.userId !== userId) return null;

    const savedMap: Record<string, boolean> = {};
    for (const a of attempt.answers) {
      savedMap[a.statementId] = a.answer;
    }

    const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    const totalDurationSeconds = attempt.tryout.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    return {
      attemptId: attempt.id,
      tryoutTitle: attempt.tryout.title,
      startedAt: attempt.startedAt,
      durationMinutes: attempt.tryout.durationMinutes,
      remainingSeconds,
      violationCount: attempt.violationCount,
      maxViolations: 3,
      participant: {
        id: attempt.user.id,
        name: attempt.user.name,
        email: attempt.user.email,
      },
      questions: attempt.tryout.questions.map((q) => ({
        id: q.id,
        order: q.order,
        stem: q.stem,
        statements: q.statements.map((s) => ({
          id: s.id,
          order: s.order,
          text: s.text,
          userAnswer: savedMap[s.id] ?? null,
        })),
      })),
    };
  }

  async saveAnswers(attemptId: string, answers: { statementId: string; answer: boolean }[]): Promise<number> {
    await prisma.$transaction(
      answers.map((ans) =>
        prisma.attemptAnswer.upsert({
          where: { attemptId_statementId: { attemptId, statementId: ans.statementId } },
          update: { answer: ans.answer },
          create: { attemptId, statementId: ans.statementId, answer: ans.answer },
        })
      )
    );
    return answers.length;
  }

  async recordViolation(
    attemptId: string,
    userId: string,
    type: ViolationType,
    detail?: string,
    maxViolations = 3
  ): Promise<RecordViolationResult> {
    const updatedCount = await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.findUnique({
        where: { id: attemptId },
        select: { id: true, userId: true, status: true, violationCount: true },
      });

      if (!attempt || attempt.userId !== userId) {
        throw new Error("NOT_FOUND");
      }

      if (attempt.status === "SUBMITTED") {
        return { count: attempt.violationCount, alreadySubmitted: true };
      }

      await tx.attemptViolation.create({
        data: { attemptId, type, detail },
      });

      const updated = await tx.attempt.update({
        where: { id: attemptId },
        data: { violationCount: { increment: 1 } },
        select: { violationCount: true },
      });

      return { count: updated.violationCount, alreadySubmitted: false };
    });

    if (updatedCount.alreadySubmitted) {
      return {
        violationCount: updatedCount.count,
        maxViolations,
        autoSubmitted: true,
      };
    }

    if (updatedCount.count >= maxViolations) {
      const scoreResult = await this.submitAttempt(attemptId, userId);
      return {
        violationCount: updatedCount.count,
        maxViolations,
        autoSubmitted: true,
        scoreResult,
      };
    }

    return {
      violationCount: updatedCount.count,
      maxViolations,
      autoSubmitted: false,
    };
  }

  async submitAttempt(attemptId: string, userId: string): Promise<{ attemptId: string; score: number; max: number; percent: number }> {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        tryout: { include: { questions: { include: { statements: true } } } },
        answers: true,
      },
    });

    if (!attempt || attempt.userId !== userId) throw new Error("NOT_FOUND");

    const answersMap = new Map<string, boolean>();
    for (const a of attempt.answers) {
      answersMap.set(a.statementId, a.answer);
    }

    let score = 0;
    const max = 30;

    for (const q of attempt.tryout.questions) {
      for (const s of q.statements) {
        const userAns = answersMap.get(s.id);
        if (userAns !== undefined && userAns === s.isTrue) {
          score += 1;
        }
      }
    }

    const percent = Number(((score / max) * 100).toFixed(1));

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        score,
      },
    });

    return { attemptId, score, max, percent };
  }

  async getExamResult(attemptId: string, userId: string, isAdmin = false): Promise<ExamResult | null> {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        tryout: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: { statements: { orderBy: { order: "asc" } } },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || (!isAdmin && attempt.userId !== userId)) return null;
    if (attempt.status !== "SUBMITTED") return null;

    const answersMap = new Map<string, boolean>();
    for (const a of attempt.answers) {
      answersMap.set(a.statementId, a.answer);
    }

    const durationSeconds = attempt.submittedAt
      ? Math.max(0, Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000))
      : 0;

    let totalCorrect = 0;
    const questions = attempt.tryout.questions.map((q) => {
      let correctCount = 0;
      const statements = q.statements.map((s) => {
        const userAns = answersMap.get(s.id) ?? null;
        const isCorrect = userAns !== null && userAns === s.isTrue;
        if (isCorrect) {
          correctCount++;
          totalCorrect++;
        }
        return {
          id: s.id,
          order: s.order,
          text: s.text,
          userAnswer: userAns,
          isTrue: s.isTrue,
          isCorrect,
          explanation: s.explanation,
        };
      });

      return {
        id: q.id,
        order: q.order,
        stem: q.stem,
        correctCount,
        statements,
      };
    });

    const percent = Number(((totalCorrect / 30) * 100).toFixed(1));

    return {
      attemptId: attempt.id,
      tryoutTitle: attempt.tryout.title,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationSeconds,
      score: totalCorrect,
      maxScore: 30,
      percent,
      questions,
    };
  }

  async findUserAttemptHistory(userId: string) {
    const attempts = await prisma.attempt.findMany({
      where: { userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      include: { tryout: { select: { title: true } } },
    });

    return attempts.map((att) => {
      const durationSeconds = att.submittedAt
        ? Math.max(0, Math.floor((att.submittedAt.getTime() - att.startedAt.getTime()) / 1000))
        : 0;
      const score = att.score ?? 0;
      const percent = Number(((score / 30) * 100).toFixed(1));

      return {
        id: att.id,
        tryoutTitle: att.tryout.title,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        durationSeconds,
        score,
        maxScore: 30,
        percent,
      };
    });
  }

  async getSubmittedAttemptsStats(): Promise<{ count: number; avgScore: number }> {
    const submitted = await prisma.attempt.findMany({
      where: { status: "SUBMITTED", isTest: false },
      select: { score: true },
    });
    const count = submitted.length;
    const avgScore = count > 0 ? Number((submitted.reduce((acc, c) => acc + (c.score ?? 0), 0) / count).toFixed(1)) : 0;
    return { count, avgScore };
  }
}
