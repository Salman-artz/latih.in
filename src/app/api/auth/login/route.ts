import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Rate limiting per-IP dan per-akun secara paralel untuk performa optimal
    const normalizedEmail = validated.email.toLowerCase().trim();
    await Promise.all([
      checkRateLimit({ key: `login-ip:${ip}`, limit: 10, windowSeconds: 60 }),
      checkRateLimit({ key: `login-acc:${normalizedEmail}`, limit: 15, windowSeconds: 60 }),
    ]);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    // Keamanan: Tolak dengan pesan generik agar tidak membocorkan keberadaan akun
    if (!user || !user.isActive) {
      return errorResponse("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    await setSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
