import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pastikan parameter schema=latih_in otomatis ada jika koneksi mengarah ke sumobase
function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (url.includes("sumobase.my.id") && !url.includes("schema=")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}schema=latih_in`;
  }
  return url;
}

const dbUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: ["error"],
  });

// Selalu simpan di globalThis agar saat reuse container serverless di Vercel koneksi database tetap hangat (warm pool)
globalForPrisma.prisma = prisma;
