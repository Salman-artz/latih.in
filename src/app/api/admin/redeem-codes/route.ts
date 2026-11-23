import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { generateCodesSchema } from "@/lib/validators/admin";
import { getAdminRedeemCodes, generateRedeemCodesBatch } from "@/services/admin";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const result = await getAdminRedeemCodes({ page, limit, status, search });
    return NextResponse.json(result);
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
    const validated = generateCodesSchema.parse(body);

    const result = await generateRedeemCodesBatch({
      adminId: session.userId,
      count: validated.count,
      durationDays: validated.durationDays,
      label: validated.label,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
