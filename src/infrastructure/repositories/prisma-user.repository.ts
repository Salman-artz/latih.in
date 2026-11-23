import { prisma } from "@/lib/db";
import { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import { UserEntity, UserRole } from "@/core/domain/entities/user.entity";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async create(data: Omit<UserEntity, "id" | "createdAt" | "isActive">): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async countAll(): Promise<number> {
    return await prisma.user.count();
  }

  async countCreatedAfter(date: Date): Promise<number> {
    return await prisma.user.count({ where: { createdAt: { gte: date } } });
  }
}
