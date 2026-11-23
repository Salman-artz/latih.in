import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await checkRateLimit({ key: `register:${ip}`, limit: 10, windowSeconds: 60 });

    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Cek email unik
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return errorResponse("Email sudah terdaftar", 400, "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await setSessionCookie({ userId: user.id, role: user.role });

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
