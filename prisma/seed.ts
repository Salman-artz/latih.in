import { PrismaClient, Role, ContentStatus, SubscriptionSource } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedMaterials } from "./seed-data/materials";
import { seedQuestions } from "./seed-data/tryouts";

const prisma = new PrismaClient();

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[-\s]/g, "");
}

async function main() {
  console.log("🌱 Memulai seeding database latih.in...");

  // 1. Password hash untuk user demo
  const passwordHash = await bcrypt.hash("Demo#12345", 10);

  // 2. Akun Admin Demo
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.test" },
    update: {
      name: "Administrator latih.in",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: "admin@demo.test",
      name: "Administrator latih.in",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin terdaftar: ${admin.email}`);

  // 3. Akun User Demo (tanpa langganan)
  const user = await prisma.user.upsert({
    where: { email: "user@demo.test" },
    update: {
      name: "Pengguna Demo",
      passwordHash,
      role: Role.USER,
      isActive: true,
    },
    create: {
      email: "user@demo.test",
      name: "Pengguna Demo",
      passwordHash,
      role: Role.USER,
      isActive: true,
    },
  });
  console.log(`✅ User demo terdaftar: ${user.email}`);

  // 4. 5 Kode Redeem Demo 30 Hari (disimpan ternormalisasi)
  const rawCodes = [
    "LATIH-DEMO-0001",
    "LATIH-DEMO-0002",
    "LATIH-DEMO-0003",
    "LATIH-DEMO-0004",
    "LATIH-DEMO-0005",
  ];

  for (const raw of rawCodes) {
    const normalized = normalizeCode(raw);
    await prisma.redeemCode.upsert({
      where: { code: normalized },
      update: {
        durationDays: 30,
        label: "Demo Reviewer",
        createdById: admin.id,
      },
      create: {
        code: normalized,
        durationDays: 30,
        label: "Demo Reviewer",
        createdById: admin.id,
      },
    });
  }
  console.log(`✅ 5 Kode redeem demo berhasil disiapkan: ${rawCodes.join(", ")}`);

  // 5. 5 Materi Video YouTube
  for (const mat of seedMaterials) {
    const existing = await prisma.material.findFirst({
      where: { order: mat.order },
    });

    if (existing) {
      await prisma.material.update({
        where: { id: existing.id },
        data: {
          title: mat.title,
          description: mat.description,
          youtubeId: mat.youtubeId,
          status: ContentStatus.PUBLISHED,
        },
      });
    } else {
      await prisma.material.create({
        data: {
          title: mat.title,
          description: mat.description,
          youtubeId: mat.youtubeId,
          order: mat.order,
          status: ContentStatus.PUBLISHED,
        },
      });
    }
  }
  console.log(`✅ 5 Materi video terdaftar.`);

  // 6. Paket Tryout (1 paket, 10 soal, tepat 3 pernyataan per soal)
  let tryout = await prisma.tryout.findFirst({
    where: { title: "Simulasi Literasi & Penalaran Umum Paket 1" },
  });

  if (!tryout) {
    tryout = await prisma.tryout.create({
      data: {
        title: "Simulasi Literasi & Penalaran Umum Paket 1",
        durationMinutes: 20,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  // Validasi jumlah pernyataan per soal wajib tepat 3
  for (const q of seedQuestions) {
    if (!q.statements || q.statements.length !== 3) {
      throw new Error(`Soal nomor ${q.order} tidak memiliki tepat 3 pernyataan!`);
    }

    const question = await prisma.question.upsert({
      where: {
        tryoutId_order: {
          tryoutId: tryout.id,
          order: q.order,
        },
      },
      update: {
        stem: q.stem,
      },
      create: {
        tryoutId: tryout.id,
        order: q.order,
        stem: q.stem,
      },
    });

    for (const stmt of q.statements) {
      await prisma.statement.upsert({
        where: {
          questionId_order: {
            questionId: question.id,
            order: stmt.order,
          },
        },
        update: {
          text: stmt.text,
          isTrue: stmt.isTrue,
          explanation: stmt.explanation,
        },
        create: {
          questionId: question.id,
          order: stmt.order,
          text: stmt.text,
          isTrue: stmt.isTrue,
          explanation: stmt.explanation,
        },
      });
    }
  }
  console.log(`✅ 10 Soal tryout dengan total 30 pernyataan berhasil divalidasi & disimpan.`);
  console.log("🎉 Seeding database selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal melakukan seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
