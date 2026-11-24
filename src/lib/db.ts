import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

// Selalu simpan di globalThis agar saat reuse container serverless di Vercel koneksi database tetap hangat (warm pool)
globalForPrisma.prisma = prisma;
