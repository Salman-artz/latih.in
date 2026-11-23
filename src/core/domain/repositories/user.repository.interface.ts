import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: Omit<UserEntity, "id" | "createdAt" | "isActive">): Promise<UserEntity>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  countAll(): Promise<number>;
  countCreatedAfter(date: Date): Promise<number>;
}
