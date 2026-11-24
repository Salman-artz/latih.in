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

let schemaEnsured = false;
export async function ensureDbSchema() {
  if (schemaEnsured) return;
  schemaEnsured = true;
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        -- 1. Pastikan enum ContentStatus & AttemptStatus ada
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentStatus') THEN
          CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttemptStatus') THEN
          CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');
        END IF;

        -- 2. Pastikan tabel Tryout ada
        CREATE TABLE IF NOT EXISTS "Tryout" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL,
          "durationMinutes" INTEGER NOT NULL DEFAULT 20,
          "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. Pastikan kolom tryoutId ada di Subscription dan RedeemCode
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Subscription') THEN
          ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "tryoutId" TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RedeemCode') THEN
          ALTER TABLE "RedeemCode" ADD COLUMN IF NOT EXISTS "tryoutId" TEXT;
        END IF;

        -- 4. Pastikan kolom videoType & videoUrl ada di Material
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Material') THEN
          ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "videoType" TEXT DEFAULT 'YOUTUBE';
          ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
          BEGIN
            ALTER TABLE "Material" ALTER COLUMN "youtubeId" DROP NOT NULL;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END IF;

        -- 5. Pastikan tabel Question, Statement, Attempt, Answer ada
        CREATE TABLE IF NOT EXISTS "Question" (
          "id" TEXT PRIMARY KEY,
          "tryoutId" TEXT NOT NULL,
          "stimulus" TEXT NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Statement" (
          "id" TEXT PRIMARY KEY,
          "questionId" TEXT NOT NULL,
          "statement" TEXT NOT NULL,
          "isTrue" BOOLEAN NOT NULL,
          "explanation" TEXT NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Attempt" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "tryoutId" TEXT NOT NULL,
          "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
          "score" INTEGER,
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "submittedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Answer" (
          "id" TEXT PRIMARY KEY,
          "attemptId" TEXT NOT NULL,
          "statementId" TEXT NOT NULL,
          "selectedAnswer" BOOLEAN NOT NULL,
          "isCorrect" BOOLEAN,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      END $$;
    `);
  } catch (e) {
    console.warn("ensureDbSchema skipped:", e);
  }
}
