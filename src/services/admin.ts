import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ContentStatus, Prisma } from "@prisma/client";
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

import { getAdminStatsUseCase, generateRedeemCodesUseCase } from "@/core/container";

export async function getAdminStats() {
  return await getAdminStatsUseCase.execute();
}

export async function generateRedeemCodesBatch(params: {
  adminId: string;
  count: number;
  durationDays: number;
  label?: string;
  expiresAt?: Date | null;
}) {
  return await generateRedeemCodesUseCase.execute(params);
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

  // Fungsi sanitasi sel CSV untuk mencegah CSV / Formula Injection
  const sanitizeCsvValue = (val: string): string => {
    const escaped = val.replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(escaped)) {
      return `"'${escaped}"`;
    }
    return `"${escaped}"`;
  };

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
      sanitizeCsvValue(c.code),
      c.durationDays,
      sanitizeCsvValue(codeStatus),
      sanitizeCsvValue(c.label || "-"),
      sanitizeCsvValue(expiresStr),
      sanitizeCsvValue(createdStr),
      sanitizeCsvValue(userStr),
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
