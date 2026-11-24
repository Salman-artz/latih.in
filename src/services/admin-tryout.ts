import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ContentStatus } from "@prisma/client";

export async function getAdminTryouts() {
  return await prisma.tryout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
  });
}

export async function createAdminTryout(data: {
  title: string;
  durationMinutes?: number;
  status?: "PUBLISHED" | "DRAFT";
}) {
  return await prisma.tryout.create({
    data: {
      title: data.title,
      durationMinutes: data.durationMinutes || 20,
      status: (data.status as ContentStatus) || ContentStatus.PUBLISHED,
    },
  });
}

export async function getAdminTryoutDetail(tryoutId: string) {
  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          statements: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return tryout;
}

export async function updateAdminTryout(
  id: string,
  data: {
    title?: string;
    durationMinutes?: number;
    status?: "PUBLISHED" | "DRAFT";
  }
) {
  const existing = await prisma.tryout.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.tryout.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
      ...(data.status !== undefined ? { status: data.status as ContentStatus } : {}),
    },
  });
}

export async function deleteAdminTryout(id: string) {
  const existing = await prisma.tryout.findUnique({
    where: { id },
    include: {
      _count: {
        select: { attempts: true },
      },
    },
  });

  if (!existing) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.tryout.delete({
    where: { id },
  });
}

export async function createAdminQuestion(
  tryoutId: string,
  data: {
    order?: number;
    stem: string;
    statements: {
      order?: number;
      text: string;
      isTrue: boolean;
      explanation: string;
    }[];
  }
) {
  const tryout = await prisma.tryout.findUnique({ where: { id: tryoutId } });
  if (!tryout) {
    throw new AppError("Paket tryout tidak ditemukan", 404, "NOT_FOUND");
  }

  // Tentukan order jika tidak diberikan
  let order = data.order;
  if (!order) {
    const lastQuestion = await prisma.question.findFirst({
      where: { tryoutId },
      orderBy: { order: "desc" },
    });
    order = (lastQuestion?.order || 0) + 1;
  }

  return await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        tryoutId,
        order,
        stem: data.stem,
        statements: {
          create: data.statements.map((s, index) => ({
            order: s.order || index + 1,
            text: s.text,
            isTrue: s.isTrue,
            explanation: s.explanation,
          })),
        },
      },
      include: {
        statements: {
          orderBy: { order: "asc" },
        },
      },
    });

    return question;
  });
}

export async function updateAdminQuestion(
  tryoutId: string,
  questionId: string,
  data: {
    order?: number;
    stem?: string;
    statements?: {
      id?: string;
      order?: number;
      text: string;
      isTrue: boolean;
      explanation: string;
    }[];
  }
) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    include: { statements: true },
  });

  if (!existing || existing.tryoutId !== tryoutId) {
    throw new AppError("Soal tidak ditemukan", 404, "NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    if (data.statements) {
      // Hapus statements lama dan buat ulang agar urutan & integritas terjaga
      await tx.statement.deleteMany({
        where: { questionId },
      });

      await tx.statement.createMany({
        data: data.statements.map((s, index) => ({
          questionId,
          order: s.order || index + 1,
          text: s.text,
          isTrue: s.isTrue,
          explanation: s.explanation,
        })),
      });
    }

    const updated = await tx.question.update({
      where: { id: questionId },
      data: {
        ...(data.stem !== undefined ? { stem: data.stem } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
      },
      include: {
        statements: {
          orderBy: { order: "asc" },
        },
      },
    });

    return updated;
  });
}

export async function deleteAdminQuestion(tryoutId: string, questionId: string) {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!existing || existing.tryoutId !== tryoutId) {
    throw new AppError("Soal tidak ditemukan", 404, "NOT_FOUND");
  }

  await prisma.question.delete({
    where: { id: questionId },
  });

  // Re-index remaining questions
  const remaining = await prisma.question.findMany({
    where: { tryoutId },
    orderBy: { order: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i + 1) {
      await prisma.question.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }
  }

  return { success: true };
}
