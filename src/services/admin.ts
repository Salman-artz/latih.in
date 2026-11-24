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
  maxUses?: number;
  label?: string;
  tryoutId?: string | null;
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

  let total = 0;
  interface AdminRedeemCodeRecord {
    id: string;
    code: string;
    durationDays: number;
    maxUses: number;
    usedCount: number;
    isUsed: boolean;
    label: string | null;
    tryoutId: string | null;
    tryout?: {
      id: string;
      title: string;
    } | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    subscriptions: Array<{
      user: {
        id: string;
        name: string;
        email: string;
      };
    }>;
  }

  let codes: AdminRedeemCodeRecord[] = [];

  try {
    const [t, c] = await Promise.all([
      prisma.redeemCode.count({ where }),
      prisma.redeemCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tryout: {
            select: {
              id: true,
              title: true,
            },
          },
          subscriptions: {
            take: 5,
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
    total = t;
    codes = c as unknown as AdminRedeemCodeRecord[];
  } catch (err) {
    console.warn("getAdminRedeemCodes fallback query:", err);
    try {
      const [t, c] = await Promise.all([
        prisma.redeemCode.count({ where }),
        prisma.redeemCode.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            subscriptions: {
              take: 5,
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        }),
      ]);
      total = t;
      codes = c as unknown as AdminRedeemCodeRecord[];
    } catch {
      total = 0;
      codes = [];
    }
  }

  return {
    codes: codes.map((c) => {
      let codeStatus = "AVAILABLE";
      if (c.revokedAt) codeStatus = "REVOKED";
      else if (c.isUsed || c.usedCount >= c.maxUses) codeStatus = "USED";
      else if (c.expiresAt && c.expiresAt <= now) codeStatus = "EXPIRED";

      const firstUser = c.subscriptions?.[0]?.user;

      return {
        id: c.id,
        code: c.code,
        durationDays: c.durationDays,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        label: c.label,
        tryoutId: c.tryoutId,
        tryoutTitle: c.tryout?.title || null,
        status: codeStatus,
        expiresAt: c.expiresAt,
        usedAt: c.usedAt,
        usedBy: firstUser
          ? {
              name: firstUser.name,
              email: firstUser.email,
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

export async function updateRedeemCode(
  codeId: string,
  data: {
    code?: string;
    durationDays?: number;
    maxUses?: number;
    label?: string | null;
    tryoutId?: string | null;
    expiresAt?: Date | null;
  }
) {
  const existing = await prisma.redeemCode.findUnique({
    where: { id: codeId },
  });

  if (!existing) {
    throw new AppError("Kode redeem tidak ditemukan", 404, "NOT_FOUND");
  }

  if (existing.revokedAt) {
    throw new AppError("Kode yang sudah dicabut tidak dapat diubah", 400, "ALREADY_REVOKED");
  }

  const updateData: Prisma.RedeemCodeUpdateInput = {};

  if (data.code && data.code !== existing.code) {
    const codeConflict = await prisma.redeemCode.findFirst({
      where: {
        code: data.code,
        id: { not: codeId },
      },
    });
    if (codeConflict) {
      throw new AppError("Kode redeem sudah dipakai oleh voucher lain", 400, "CODE_ALREADY_EXISTS");
    }
    updateData.code = data.code;
  }

  if (data.durationDays !== undefined) {
    updateData.durationDays = data.durationDays;
  }

  if (data.label !== undefined) {
    updateData.label = data.label;
  }

  if (data.tryoutId !== undefined) {
    updateData.tryout = data.tryoutId ? { connect: { id: data.tryoutId } } : { disconnect: true };
  }

  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt;
  }

  if (data.maxUses !== undefined) {
    if (data.maxUses < existing.usedCount) {
      throw new AppError(
        `Kuota tidak boleh lebih kecil dari jumlah pengguna yang sudah menukarkan kode (${existing.usedCount} pengguna)`,
        400,
        "INVALID_MAX_USES"
      );
    }
    updateData.maxUses = data.maxUses;

    const now = new Date();
    const effectiveExpiresAt = data.expiresAt !== undefined ? data.expiresAt : existing.expiresAt;
    const isExpired = effectiveExpiresAt && effectiveExpiresAt <= now;

    if (data.maxUses > existing.usedCount && !isExpired) {
      updateData.isUsed = false;
    } else if (data.maxUses <= existing.usedCount) {
      updateData.isUsed = true;
    }
  }

  return await prisma.redeemCode.update({
    where: { id: codeId },
    data: updateData,
  });
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
      tryout: {
        select: { title: true },
      },
      subscriptions: {
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

  const headers = [
    "Kode",
    "Paket Tryout",
    "Durasi (Hari)",
    "Kuota Maksimal",
    "Terpakai",
    "Sisa Kuota",
    "Status",
    "Label Batch",
    "Kedaluwarsa",
    "Dibuat Pada",
    "Pemakai",
  ];
  const rows = codes.map((c) => {
    let codeStatus = "Tersedia";
    if (c.revokedAt) codeStatus = "Dicabut";
    else if (c.isUsed || c.usedCount >= c.maxUses) codeStatus = "Terpakai (Penuh)";
    else if (c.expiresAt && c.expiresAt <= now) codeStatus = "Kedaluwarsa";

    const userStr =
      c.subscriptions && c.subscriptions.length > 0
        ? c.subscriptions.map((s) => `${s.user.name} (${s.user.email})`).join("; ")
        : "-";
    const remainingQuota = Math.max(0, c.maxUses - c.usedCount);
    const expiresStr = c.expiresAt ? c.expiresAt.toISOString() : "-";
    const createdStr = c.createdAt.toISOString();
    const tryoutTitleStr = c.tryout?.title || "Semua Tryout (Akses Penuh)";

    return [
      sanitizeCsvValue(c.code),
      sanitizeCsvValue(tryoutTitleStr),
      c.durationDays,
      c.maxUses,
      c.usedCount,
      remainingQuota,
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
  videoType?: string;
  youtubeUrl?: string | null;
  videoUrl?: string | null;
  order: number;
}) {
  const videoType = data.videoType || (data.videoUrl ? "CLOUDINARY" : "YOUTUBE");
  let youtubeId: string | null = null;

  if (videoType === "YOUTUBE") {
    if (!data.youtubeUrl) {
      throw new AppError("URL atau ID YouTube wajib diisi", 400, "INVALID_YOUTUBE_URL");
    }
    youtubeId = extractYoutubeId(data.youtubeUrl);
    if (!youtubeId) {
      throw new AppError("URL atau ID YouTube tidak valid", 400, "INVALID_YOUTUBE_URL");
    }
  } else if (videoType === "CLOUDINARY") {
    if (!data.videoUrl) {
      throw new AppError("URL video Cloudinary wajib diisi", 400, "INVALID_VIDEO_URL");
    }
  }

  return await prisma.material.create({
    data: {
      title: data.title,
      description: data.description,
      videoType,
      youtubeId,
      videoUrl: data.videoUrl || null,
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
    videoType?: string;
    youtubeUrl?: string | null;
    videoUrl?: string | null;
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

  if (data.videoType !== undefined) {
    updateData.videoType = data.videoType;
  }

  if (data.videoUrl !== undefined) {
    updateData.videoUrl = data.videoUrl;
  }

  if (data.youtubeUrl !== undefined) {
    if (data.youtubeUrl) {
      const youtubeId = extractYoutubeId(data.youtubeUrl);
      if (!youtubeId) {
        throw new AppError("URL atau ID YouTube tidak valid", 400, "INVALID_YOUTUBE_URL");
      }
      updateData.youtubeId = youtubeId;
    } else {
      updateData.youtubeId = null;
    }
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
