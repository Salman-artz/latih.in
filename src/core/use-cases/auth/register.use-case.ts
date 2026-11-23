import { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { IPasswordHasher } from "@/infrastructure/security/security.interfaces";
import { AppError } from "@/lib/errors";

export class RegisterUseCase {
  constructor(
    private userRepo: IUserRepository,
    private hasher: IPasswordHasher
  ) {}

  async execute(input: { name: string; email: string; password: string }) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError("Email sudah terdaftar", 400, "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "USER",
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
