import { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { IPasswordHasher } from "@/infrastructure/security/security.interfaces";
import { AppError } from "@/lib/errors";

export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hasher: IPasswordHasher
  ) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new AppError("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await this.hasher.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
