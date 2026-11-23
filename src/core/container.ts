import { PrismaUserRepository } from "@/infrastructure/repositories/prisma-user.repository";
import { PrismaSubscriptionRepository } from "@/infrastructure/repositories/prisma-subscription.repository";
import { PrismaRedeemCodeRepository } from "@/infrastructure/repositories/prisma-redeem-code.repository";
import { PrismaMaterialRepository } from "@/infrastructure/repositories/prisma-material.repository";
import { PrismaTryoutRepository } from "@/infrastructure/repositories/prisma-tryout.repository";
import { PrismaRateLimitRepository } from "@/infrastructure/repositories/prisma-rate-limit.repository";
import { BcryptPasswordHasher } from "@/infrastructure/security/password-hasher.service";
import { JoseTokenService } from "@/infrastructure/security/jwt.service";

import { RegisterUseCase } from "@/core/use-cases/auth/register.use-case";
import { LoginUseCase } from "@/core/use-cases/auth/login.use-case";
import { ChangePasswordUseCase } from "@/core/use-cases/auth/change-password.use-case";
import { GetUserSubscriptionUseCase } from "@/core/use-cases/subscription/get-user-subscription.use-case";
import { RedeemCodeUseCase } from "@/core/use-cases/redeem/redeem-code.use-case";
import {
  GetMaterialsUseCase,
  GetMaterialDetailUseCase,
  ToggleMaterialProgressUseCase,
} from "@/core/use-cases/materials/materials.use-cases";
import {
  StartOrResumeTryoutUseCase,
  GetExamSheetUseCase,
  SaveExamAnswersUseCase,
  SubmitTryoutUseCase,
  GetExamResultUseCase,
  GetAttemptHistoryUseCase,
} from "@/core/use-cases/tryout/tryout.use-cases";
import {
  GetAdminStatsUseCase,
  GenerateRedeemCodesUseCase,
} from "@/core/use-cases/admin/admin.use-cases";

// 1. Repositories (Infrastructure Layer)
export const userRepository = new PrismaUserRepository();
export const subscriptionRepository = new PrismaSubscriptionRepository();
export const redeemCodeRepository = new PrismaRedeemCodeRepository();
export const materialRepository = new PrismaMaterialRepository();
export const tryoutRepository = new PrismaTryoutRepository();
export const rateLimitRepository = new PrismaRateLimitRepository();

// 2. Security Adapters
export const passwordHasher = new BcryptPasswordHasher();
export const tokenService = new JoseTokenService();

// 3. Application Use Cases
export const registerUseCase = new RegisterUseCase(userRepository, passwordHasher);
export const loginUseCase = new LoginUseCase(userRepository, passwordHasher);
export const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordHasher);
export const getUserSubscriptionUseCase = new GetUserSubscriptionUseCase(subscriptionRepository);
export const redeemCodeUseCase = new RedeemCodeUseCase();

export const getMaterialsUseCase = new GetMaterialsUseCase(materialRepository, subscriptionRepository);
export const getMaterialDetailUseCase = new GetMaterialDetailUseCase(materialRepository, subscriptionRepository);
export const toggleMaterialProgressUseCase = new ToggleMaterialProgressUseCase(materialRepository, subscriptionRepository);

export const startOrResumeTryoutUseCase = new StartOrResumeTryoutUseCase(tryoutRepository, subscriptionRepository);
export const getExamSheetUseCase = new GetExamSheetUseCase(tryoutRepository);
export const saveExamAnswersUseCase = new SaveExamAnswersUseCase(tryoutRepository);
export const submitTryoutUseCase = new SubmitTryoutUseCase(tryoutRepository);
export const getExamResultUseCase = new GetExamResultUseCase(tryoutRepository);
export const getAttemptHistoryUseCase = new GetAttemptHistoryUseCase(tryoutRepository);

export const getAdminStatsUseCase = new GetAdminStatsUseCase(
  userRepository,
  subscriptionRepository,
  redeemCodeRepository,
  tryoutRepository
);
export const generateRedeemCodesUseCase = new GenerateRedeemCodesUseCase(redeemCodeRepository);
