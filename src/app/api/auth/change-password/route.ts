import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validators/auth";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    // Rate Limiting Berbasis User dan IP untuk mencegah Brute-Force Password Saat Ini
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await checkRateLimit({ key: `change-pwd-user:${session.userId}`, limit: 5, windowSeconds: 60 });
    await checkRateLimit({ key: `change-pwd-ip:${ip}`, limit: 10, windowSeconds: 60 });

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return errorResponse("Pengguna tidak ditemukan", 404, "NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Password saat ini salah", 400, "INVALID_PASSWORD");
    }

    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Perbarui sesi cookie dengan token baru setelah password berhasil diubah
    await setSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
