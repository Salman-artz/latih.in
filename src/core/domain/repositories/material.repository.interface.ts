import { MaterialEntity, MaterialWithProgress, ContentStatus } from "../entities/material.entity";

export interface IMaterialRepository {
  findPublishedForUser(userId: string): Promise<MaterialWithProgress[]>;
  findByIdForUser(materialId: string, userId: string): Promise<MaterialWithProgress | null>;
  toggleProgress(materialId: string, userId: string): Promise<{ isCompleted: boolean }>;
  findAllForAdmin(): Promise<(MaterialEntity & { progressCount: number })[]>;
  create(data: { title: string; description: string; youtubeId: string; order: number; status?: ContentStatus }): Promise<MaterialEntity>;
  update(id: string, data: Partial<{ title: string; description: string; youtubeId: string; order: number; status: ContentStatus }>): Promise<MaterialEntity>;
  findById(id: string): Promise<(MaterialEntity & { progressCount: number }) | null>;
}
