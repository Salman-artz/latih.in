import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { createTryoutSchema } from "@/lib/validators/admin";
import { getAdminTryouts, createAdminTryout } from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const tryouts = await getAdminTryouts();
    return NextResponse.json({ tryouts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const validated = createTryoutSchema.parse(body);

    const tryout = await createAdminTryout(validated);
    return NextResponse.json({ tryout }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
