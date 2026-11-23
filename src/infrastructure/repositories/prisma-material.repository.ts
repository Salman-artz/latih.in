import { prisma } from "@/lib/db";
import { IMaterialRepository } from "@/core/domain/repositories/material.repository.interface";
import { MaterialEntity, MaterialWithProgress, ContentStatus } from "@/core/domain/entities/material.entity";

export class PrismaMaterialRepository implements IMaterialRepository {
  async findPublishedForUser(userId: string): Promise<MaterialWithProgress[]> {
    const materials = await prisma.material.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: {
        progress: { where: { userId } },
      },
    });

    return materials.map((m) => ({
      ...m,
      status: m.status as ContentStatus,
      isCompleted: m.progress.length > 0,
      watchedAt: m.progress[0]?.watchedAt || null,
    }));
  }

  async findByIdForUser(materialId: string, userId: string): Promise<MaterialWithProgress | null> {
    const material = await prisma.material.findUnique({
      where: { id: materialId, status: "PUBLISHED" },
      include: {
        progress: { where: { userId } },
      },
    });

    if (!material) return null;

    return {
      ...material,
      status: material.status as ContentStatus,
      isCompleted: material.progress.length > 0,
      watchedAt: material.progress[0]?.watchedAt || null,
    };
  }

  async toggleProgress(materialId: string, userId: string): Promise<{ isCompleted: boolean }> {
    const existing = await prisma.materialProgress.findUnique({
      where: { userId_materialId: { userId, materialId } },
    });

    if (existing) {
      await prisma.materialProgress.delete({
        where: { userId_materialId: { userId, materialId } },
      });
      return { isCompleted: false };
    } else {
      await prisma.materialProgress.create({
        data: { userId, materialId },
      });
      return { isCompleted: true };
    }
  }

  async findAllForAdmin(): Promise<(MaterialEntity & { progressCount: number })[]> {
    const materials = await prisma.material.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { progress: true } },
      },
    });

    return materials.map((m) => ({
      ...m,
      status: m.status as ContentStatus,
      progressCount: m._count.progress,
    }));
  }

  async create(data: { title: string; description: string; youtubeId: string; order: number; status?: ContentStatus }): Promise<MaterialEntity> {
    const material = await prisma.material.create({
      data: {
        title: data.title,
        description: data.description,
        youtubeId: data.youtubeId,
        order: data.order,
        status: data.status || "PUBLISHED",
      },
    });
    return {
      ...material,
      status: material.status as ContentStatus,
    };
  }

  async update(id: string, data: Partial<{ title: string; description: string; youtubeId: string; order: number; status: ContentStatus }>): Promise<MaterialEntity> {
    const material = await prisma.material.update({
      where: { id },
      data,
    });
    return {
      ...material,
      status: material.status as ContentStatus,
    };
  }

  async findById(id: string): Promise<(MaterialEntity & { progressCount: number }) | null> {
    const material = await prisma.material.findUnique({
      where: { id },
      include: { _count: { select: { progress: true } } },
    });
    if (!material) return null;
    return {
      ...material,
      status: material.status as ContentStatus,
      progressCount: material._count.progress,
    };
  }
}
