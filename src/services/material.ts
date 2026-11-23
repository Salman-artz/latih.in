import {
  getMaterialsUseCase,
  getMaterialDetailUseCase,
  toggleMaterialProgressUseCase,
} from "@/core/container";

export async function getMaterialsForUser(userId: string) {
  return await getMaterialsUseCase.execute(userId);
}

export async function getMaterialDetailForUser(userId: string, materialId: string) {
  return await getMaterialDetailUseCase.execute(userId, materialId);
}

export async function toggleMaterialProgress(userId: string, materialId: string) {
  return await toggleMaterialProgressUseCase.execute(userId, materialId);
}
