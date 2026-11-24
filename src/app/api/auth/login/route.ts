import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const t0 = Date.now();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await checkRateLimit({ key: `login-ip:${ip}`, limit: 10, windowSeconds: 60 });
    const t1 = Date.now();

    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Rate limiting per-akun untuk memitigasi serangan brute-force terdistribusi lintas IP
    const normalizedEmail = validated.email.toLowerCase().trim();
    await checkRateLimit({ key: `login-acc:${normalizedEmail}`, limit: 15, windowSeconds: 60 });
    const t2 = Date.now();

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    const t3 = Date.now();

    // Keamanan: Tolak dengan pesan generik agar tidak membocorkan keberadaan akun
    if (!user || !user.isActive) {
      return errorResponse("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    const t4 = Date.now();
    if (!isMatch) {
      return errorResponse("Email atau password salah", 401, "INVALID_CREDENTIALS");
    }

    await setSessionCookie({ userId: user.id, role: user.role });
    const t5 = Date.now();

    return NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      _timings: {
        rateLimitIp: t1 - t0,
        rateLimitAcc: t2 - t1,
        queryUser: t3 - t2,
        bcryptCompare: t4 - t3,
        sessionCookie: t5 - t4,
        totalServerMs: t5 - t0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
