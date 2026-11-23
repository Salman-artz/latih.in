import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { AttemptStatus, ContentStatus, Role } from "@prisma/client";
import { getUserSubscription } from "./subscription";

export async function startOrResumeAttempt(userId: string, userRole: Role = Role.USER) {
  // 1. Cek langganan aktif (Admin diperbolehkan dalam mode uji coba isTest)
  const isTestAttempt = userRole === Role.ADMIN;
  if (!isTestAttempt) {
    const sub = await getUserSubscription(userId);
    if (!sub.isActive) {
      throw new AppError("Langganan aktif diperlukan untuk memulai tryout", 403, "SUBSCRIPTION_REQUIRED");
    }
  }

  // Cari paket tryout yang aktif
  const tryout = await prisma.tryout.findFirst({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  });

  if (!tryout) {
    throw new AppError("Paket tryout belum tersedia", 404, "TRYOUT_NOT_FOUND");
  }

  // 2. Cek apakah ada attempt IN_PROGRESS yang belum diselesaikan
  const existingAttempt = await prisma.attempt.findFirst({
    where: {
      userId,
      tryoutId: tryout.id,
      status: AttemptStatus.IN_PROGRESS,
    },
    orderBy: { startedAt: "desc" },
  });

  if (existingAttempt) {
    // Periksa apakah waktu durasi tryout telah habis (Auto-Submit)
    const elapsedSeconds = Math.floor((Date.now() - existingAttempt.startedAt.getTime()) / 1000);
    const maxSeconds = tryout.durationMinutes * 60;

    if (elapsedSeconds >= maxSeconds) {
      // Waktu habis, otomatis submit
      await submitAttempt(userId, existingAttempt.id);
      throw new AppError("Waktu tryout telah habis, attempt telah disubmit otomatis", 400, "EXAM_EXPIRED");
    }

    return {
      attemptId: existingAttempt.id,
      isNew: false,
    };
  }

  // 3. Buat attempt baru
  const newAttempt = await prisma.attempt.create({
    data: {
      userId,
      tryoutId: tryout.id,
      status: AttemptStatus.IN_PROGRESS,
      isTest: isTestAttempt,
    },
  });

  return {
    attemptId: newAttempt.id,
    isNew: true,
  };
}

export async function getAttemptForExam(userId: string, attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      tryout: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              statements: {
                orderBy: { order: "asc" },
                // KEAMANAN KRITIS: JANGAN PERNAH menyertakan isTrue atau explanation!
                select: {
                  id: true,
                  order: true,
                  text: true,
                },
              },
            },
          },
        },
      },
      answers: {
        select: {
          statementId: true,
          answer: true,
        },
      },
    },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Attempt tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  if (attempt.status === AttemptStatus.SUBMITTED) {
    throw new AppError("Tryout ini sudah diselesaikan", 400, "ALREADY_SUBMITTED");
  }

  // Periksa sisa waktu pengerjaan
  const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
  const totalDurationSeconds = attempt.tryout.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  if (remainingSeconds <= 0) {
    // Auto-submit bila waktu habis
    await submitAttempt(userId, attemptId);
    throw new AppError("Waktu tryout telah habis, attempt telah disubmit otomatis", 400, "EXAM_EXPIRED");
  }

  // Peta jawaban yang tersimpan
  const savedAnswersMap: Record<string, boolean> = {};
  for (const ans of attempt.answers) {
    savedAnswersMap[ans.statementId] = ans.answer;
  }

  return {
    attemptId: attempt.id,
    tryoutTitle: attempt.tryout.title,
    startedAt: attempt.startedAt,
    durationMinutes: attempt.tryout.durationMinutes,
    remainingSeconds,
    questions: attempt.tryout.questions.map((q) => ({
      id: q.id,
      order: q.order,
      stem: q.stem,
      statements: q.statements.map((s) => ({
        id: s.id,
        order: s.order,
        text: s.text,
        userAnswer: savedAnswersMap[s.id] ?? null,
      })),
    })),
  };
}

export async function saveAnswers(
  userId: string,
  attemptId: string,
  answers: { statementId: string; answer: boolean }[]
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Attempt tidak ditemukan", 404, "NOT_FOUND");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError("Attempt sudah disubmit dan tidak dapat diubah", 400, "ALREADY_SUBMITTED");
  }

  // Simpan/upsert jawaban
  await prisma.$transaction(
    answers.map((ans) =>
      prisma.attemptAnswer.upsert({
        where: {
          attemptId_statementId: {
            attemptId,
            statementId: ans.statementId,
          },
        },
        update: {
          answer: ans.answer,
        },
        create: {
          attemptId,
          statementId: ans.statementId,
          answer: ans.answer,
        },
      })
    )
  );

  return { saved: answers.length };
}

export async function submitAttempt(userId: string, attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      tryout: {
        include: {
          questions: {
            include: {
              statements: true,
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Attempt tidak ditemukan", 404, "NOT_FOUND");
  }

  if (attempt.status === AttemptStatus.SUBMITTED) {
    throw new AppError("Attempt sudah pernah disubmit", 400, "ALREADY_SUBMITTED");
  }

  // Peta jawaban pengguna
  const userAnswersMap = new Map<string, boolean>();
  for (const ans of attempt.answers) {
    userAnswersMap.set(ans.statementId, ans.answer);
  }

  // Hitung skor: 1 poin per pernyataan yang benar, max 30
  let totalScore = 0;
  const totalStatements = 30;

  for (const q of attempt.tryout.questions) {
    for (const stmt of q.statements) {
      const userAns = userAnswersMap.get(stmt.id);
      if (userAns !== undefined && userAns === stmt.isTrue) {
        totalScore += 1;
      }
    }
  }

  const now = new Date();
  const percent = Number(((totalScore / totalStatements) * 100).toFixed(1));

  const updatedAttempt = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt: now,
      score: totalScore,
    },
  });

  return {
    attemptId: updatedAttempt.id,
    score: totalScore,
    max: totalStatements,
    percent,
  };
}

export async function getAttemptResult(userId: string, attemptId: string, userRole: Role = Role.USER) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      tryout: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: {
              statements: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  // Pemilik atau Admin yang berhak melihat hasil
  if (!attempt || (attempt.userId !== userId && userRole !== Role.ADMIN)) {
    throw new AppError("Hasil tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  if (attempt.status !== AttemptStatus.SUBMITTED) {
    throw new AppError("Tryout belum disubmit", 400, "NOT_SUBMITTED");
  }

  const userAnswersMap = new Map<string, boolean>();
  for (const ans of attempt.answers) {
    userAnswersMap.set(ans.statementId, ans.answer);
  }

  const durationSeconds = attempt.submittedAt
    ? Math.max(0, Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000))
    : 0;

  let totalCorrect = 0;
  const questionsResult = attempt.tryout.questions.map((q) => {
    let questionCorrectCount = 0;

    const statementResults = q.statements.map((stmt) => {
      const userAns = userAnswersMap.get(stmt.id) ?? null;
      const isCorrect = userAns !== null && userAns === stmt.isTrue;
      if (isCorrect) {
        questionCorrectCount += 1;
        totalCorrect += 1;
      }

      return {
        id: stmt.id,
        order: stmt.order,
        text: stmt.text,
        userAnswer: userAns,
        isTrue: stmt.isTrue,
        isCorrect,
        explanation: stmt.explanation,
      };
    });

    return {
      id: q.id,
      order: q.order,
      stem: q.stem,
      correctCount: questionCorrectCount,
      statements: statementResults,
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
    questions: questionsResult,
  };
}

export async function getUserAttemptHistory(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: {
      userId,
      status: AttemptStatus.SUBMITTED,
    },
    orderBy: {
      submittedAt: "desc",
    },
    include: {
      tryout: {
        select: {
          title: true,
          durationMinutes: true,
        },
      },
    },
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
