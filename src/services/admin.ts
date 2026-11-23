import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { AttemptStatus, ContentStatus, Prisma } from "@prisma/client";
import { extractYoutubeId } from "@/lib/validators/admin";

// Karakter tanpa ambigu (tanpa 0, O, 1, I)
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRandomCodeString(length = 12): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return result;
}

export async function getAdminStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7Days,
    activeSubscriptions,
    expiringSubscriptions,
    totalCodes,
    usedCodes,
    revokedCodes,
    submittedAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.subscription.count({ where: { endsAt: { gt: now } } }),
    prisma.subscription.count({ where: { endsAt: { gt: now, lte: sevenDaysLater } } }),
    prisma.redeemCode.count(),
    prisma.redeemCode.count({ where: { isUsed: true } }),
    prisma.redeemCode.count({ where: { revokedAt: { not: null } } }),
    prisma.attempt.findMany({
      where: { status: AttemptStatus.SUBMITTED, isTest: false },
      select: { score: true },
    }),
  ]);

  const availableCodes = await prisma.redeemCode.count({
    where: {
      isUsed: false,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const totalAttemptCount = submittedAttempts.length;
  const avgScore =
    totalAttemptCount > 0
      ? Number(
          (
            submittedAttempts.reduce((acc, curr) => acc + (curr.score ?? 0), 0) /
            totalAttemptCount
          ).toFixed(1)
        )
      : 0;

  return {
    totalUsers,
    newUsersLast7Days,
    activeSubscriptions,
    expiringSubscriptions,
    totalCodes,
    availableCodes,
    usedCodes,
    revokedCodes,
    totalAttempts: totalAttemptCount,
    avgScore,
  };
}

export async function generateRedeemCodesBatch({
  adminId,
  count,
  durationDays,
  label,
  expiresAt,
}: {
  adminId: string;
  count: number;
  durationDays: number;
  label?: string;
  expiresAt?: Date | null;
}) {
  const generatedCodes: string[] = [];
  const maxAttempts = count * 5;
  let attempts = 0;

  while (generatedCodes.length < count && attempts < maxAttempts) {
    attempts++;
    const candidate = generateRandomCodeString(12);

    // Pastikan tidak duplikat di list saat ini
    if (generatedCodes.includes(candidate)) continue;

    // Cek keunikan di database
    const exists = await prisma.redeemCode.findUnique({
      where: { code: candidate },
    });

    if (!exists) {
      generatedCodes.push(candidate);
    }
  }

  if (generatedCodes.length < count) {
    throw new AppError("Gagal menghasilkan seluruh kode unik, silakan coba lagi", 500, "GENERATION_FAILED");
  }

  await prisma.redeemCode.createMany({
    data: generatedCodes.map((code) => ({
      code,
      durationDays,
      label: label || null,
      expiresAt: expiresAt || null,
      createdById: adminId,
    })),
  });

  return {
    count: generatedCodes.length,
    codes: generatedCodes,
  };
}

export async function getAdminRedeemCodes({
  page = 1,
  limit = 20,
  status = "ALL",
  search = "",
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const now = new Date();
  const where: Prisma.RedeemCodeWhereInput = {};

  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { label: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "AVAILABLE") {
    where.isUsed = false;
    where.revokedAt = null;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
  } else if (status === "USED") {
    where.isUsed = true;
  } else if (status === "REVOKED") {
    where.revokedAt = { not: null };
  } else if (status === "EXPIRED") {
    where.isUsed = false;
    where.revokedAt = null;
    where.expiresAt = { lte: now };
  }

  const [total, codes] = await Promise.all([
    prisma.redeemCode.count({ where }),
    prisma.redeemCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    codes: codes.map((c) => {
      let codeStatus = "AVAILABLE";
      if (c.revokedAt) codeStatus = "REVOKED";
      else if (c.isUsed) codeStatus = "USED";
      else if (c.expiresAt && c.expiresAt <= now) codeStatus = "EXPIRED";

      return {
        id: c.id,
        code: c.code,
        durationDays: c.durationDays,
        label: c.label,
        status: codeStatus,
        expiresAt: c.expiresAt,
        usedAt: c.usedAt,
        usedBy: c.subscription?.user
          ? {
              name: c.subscription.user.name,
              email: c.subscription.user.email,
            }
          : null,
        createdAt: c.createdAt,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function revokeRedeemCode(codeId: string, adminId: string) {
  const code = await prisma.redeemCode.findUnique({
    where: { id: codeId },
  });

  if (!code) {
    throw new AppError("Kode redeem tidak ditemukan", 404, "NOT_FOUND");
  }

  if (code.isUsed) {
    throw new AppError("Kode yang sudah digunakan tidak dapat dicabut", 400, "ALREADY_USED");
  }

  if (code.revokedAt) {
    throw new AppError("Kode sudah dicabut sebelumnya", 400, "ALREADY_REVOKED");
  }

  const updated = await prisma.redeemCode.update({
    where: { id: codeId },
    data: {
      revokedAt: new Date(),
      revokedById: adminId,
    },
  });

  return updated;
}

export async function exportRedeemCodesCSV(status = "ALL", search = "") {
  const now = new Date();
  const where: Prisma.RedeemCodeWhereInput = {};

  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { label: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "AVAILABLE") {
    where.isUsed = false;
    where.revokedAt = null;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
  } else if (status === "USED") {
    where.isUsed = true;
  } else if (status === "REVOKED") {
    where.revokedAt = { not: null };
  } else if (status === "EXPIRED") {
    where.isUsed = false;
    where.revokedAt = null;
    where.expiresAt = { lte: now };
  }

  const codes = await prisma.redeemCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  const headers = ["Kode", "Durasi (Hari)", "Status", "Label Batch", "Kedaluwarsa", "Dibuat Pada", "Pemakai"];
  const rows = codes.map((c) => {
    let codeStatus = "Tersedia";
    if (c.revokedAt) codeStatus = "Dicabut";
    else if (c.isUsed) codeStatus = "Terpakai";
    else if (c.expiresAt && c.expiresAt <= now) codeStatus = "Kedaluwarsa";

    const userStr = c.subscription?.user ? `${c.subscription.user.name} (${c.subscription.user.email})` : "-";
    const expiresStr = c.expiresAt ? c.expiresAt.toISOString() : "-";
    const createdStr = c.createdAt.toISOString();

    return [
      `"${c.code}"`,
      c.durationDays,
      `"${codeStatus}"`,
      `"${c.label || "-"}"`,
      `"${expiresStr}"`,
      `"${createdStr}"`,
      `"${userStr}"`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export async function getAdminMaterials() {
  return await prisma.material.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { progress: true },
      },
    },
  });
}

export async function createAdminMaterial(data: {
  title: string;
  description: string;
  youtubeUrl: string;
  order: number;
}) {
  const youtubeId = extractYoutubeId(data.youtubeUrl);
  if (!youtubeId) {
    throw new AppError("URL atau ID YouTube tidak valid", 400, "INVALID_YOUTUBE_URL");
  }

  return await prisma.material.create({
    data: {
      title: data.title,
      description: data.description,
      youtubeId,
      order: data.order,
      status: ContentStatus.PUBLISHED,
    },
  });
}

export async function updateAdminMaterial(
  id: string,
  data: {
    title?: string;
    description?: string;
    youtubeUrl?: string;
    order?: number;
    status?: ContentStatus;
  }
) {
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Materi tidak ditemukan", 404, "NOT_FOUND");
  }

  const updateData: Prisma.MaterialUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.youtubeUrl) {
    const youtubeId = extractYoutubeId(data.youtubeUrl);
    if (!youtubeId) {
      throw new AppError("URL atau ID YouTube tidak valid", 400, "INVALID_YOUTUBE_URL");
    }
    updateData.youtubeId = youtubeId;
  }

  return await prisma.material.update({
    where: { id },
    data: updateData,
  });
}

export async function archiveOrDeleteMaterial(id: string) {
  const existing = await prisma.material.findUnique({
    where: { id },
    include: {
      _count: {
        select: { progress: true },
      },
    },
  });

  if (!existing) {
    throw new AppError("Materi tidak ditemukan", 404, "NOT_FOUND");
  }

  // Jika materi sudah punya riwayat progres, arsipkan (ubah status jadi DRAFT), jangan dihapus permanen
  if (existing._count.progress > 0) {
    return await prisma.material.update({
      where: { id },
      data: { status: ContentStatus.DRAFT },
    });
  }

  // Jika belum ada progres, boleh diarsipkan atau dihapus
  return await prisma.material.update({
    where: { id },
    data: { status: ContentStatus.DRAFT },
  });
}
