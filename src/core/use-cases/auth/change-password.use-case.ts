import { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { IPasswordHasher } from "@/infrastructure/security/security.interfaces";
import { AppError } from "@/lib/errors";

export class ChangePasswordUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hasher: IPasswordHasher
  ) {}

  async execute(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError("Pengguna tidak ditemukan", 404, "NOT_FOUND");
    }

    const isMatch = await this.hasher.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Password saat ini salah", 400, "INVALID_PASSWORD");
    }

    const newHash = await this.hasher.hash(input.newPassword);
    await this.userRepo.updatePassword(userId, newHash);
  }
}
