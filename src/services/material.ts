import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ContentStatus } from "@prisma/client";
import { getUserSubscription } from "./subscription";

export async function getMaterialsForUser(userId: string) {
  // Pengecekan server-side hak akses langganan
  const sub = await getUserSubscription(userId);
  if (!sub.isActive) {
    throw new AppError("Langganan aktif diperlukan untuk mengakses materi belajar", 403, "SUBSCRIPTION_REQUIRED");
  }

  const materials = await prisma.material.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
    },
    orderBy: {
      order: "asc",
    },
    include: {
      progress: {
        where: {
          userId,
        },
      },
    },
  });

  return materials.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    youtubeId: m.youtubeId,
    order: m.order,
    isCompleted: m.progress.length > 0,
    watchedAt: m.progress[0]?.watchedAt || null,
  }));
}

export async function getMaterialDetailForUser(userId: string, materialId: string) {
  const sub = await getUserSubscription(userId);
  if (!sub.isActive) {
    throw new AppError("Langganan aktif diperlukan untuk mengakses materi belajar", 403, "SUBSCRIPTION_REQUIRED");
  }

  const material = await prisma.material.findUnique({
    where: {
      id: materialId,
      status: ContentStatus.PUBLISHED,
    },
    include: {
      progress: {
        where: {
          userId,
        },
      },
    },
  });

  if (!material) {
    throw new AppError("Materi tidak ditemukan", 404, "NOT_FOUND");
  }

  return {
    id: material.id,
    title: material.title,
    description: material.description,
    youtubeId: material.youtubeId,
    order: material.order,
    isCompleted: material.progress.length > 0,
    watchedAt: material.progress[0]?.watchedAt || null,
  };
}

export async function toggleMaterialProgress(userId: string, materialId: string) {
  const sub = await getUserSubscription(userId);
  if (!sub.isActive) {
    throw new AppError("Langganan aktif diperlukan", 403, "SUBSCRIPTION_REQUIRED");
  }

  const existing = await prisma.materialProgress.findUnique({
    where: {
      userId_materialId: {
        userId,
        materialId,
      },
    },
  });

  if (existing) {
    await prisma.materialProgress.delete({
      where: {
        userId_materialId: {
          userId,
          materialId,
        },
      },
    });
    return { isCompleted: false };
  } else {
    await prisma.materialProgress.create({
      data: {
        userId,
        materialId,
      },
    });
    return { isCompleted: true };
  }
}
