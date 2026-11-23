import { IMaterialRepository } from "@/core/domain/repositories/material.repository.interface";
import { ISubscriptionRepository } from "@/core/domain/repositories/subscription.repository.interface";
import { AppError } from "@/lib/errors";

export class GetMaterialsUseCase {
  constructor(
    private materialRepo: IMaterialRepository,
    private subRepo: ISubscriptionRepository
  ) {}

  async execute(userId: string) {
    const sub = await this.subRepo.findActiveByUserId(userId, new Date());
    if (!sub) {
      throw new AppError("Langganan aktif diperlukan untuk mengakses materi belajar", 403, "SUBSCRIPTION_REQUIRED");
    }
    return await this.materialRepo.findPublishedForUser(userId);
  }
}

export class GetMaterialDetailUseCase {
  constructor(
    private materialRepo: IMaterialRepository,
    private subRepo: ISubscriptionRepository
  ) {}

  async execute(userId: string, materialId: string) {
    const sub = await this.subRepo.findActiveByUserId(userId, new Date());
    if (!sub) {
      throw new AppError("Langganan aktif diperlukan untuk mengakses materi belajar", 403, "SUBSCRIPTION_REQUIRED");
    }

    const material = await this.materialRepo.findByIdForUser(materialId, userId);
    if (!material) {
      throw new AppError("Materi tidak ditemukan", 404, "NOT_FOUND");
    }
    return material;
  }
}

export class ToggleMaterialProgressUseCase {
  constructor(
    private materialRepo: IMaterialRepository,
    private subRepo: ISubscriptionRepository
  ) {}

  async execute(userId: string, materialId: string) {
    const sub = await this.subRepo.findActiveByUserId(userId, new Date());
    if (!sub) {
      throw new AppError("Langganan aktif diperlukan", 403, "SUBSCRIPTION_REQUIRED");
    }
    return await this.materialRepo.toggleProgress(materialId, userId);
  }
}
