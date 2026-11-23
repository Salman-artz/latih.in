import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revokeRedeemCode } from "@/services/admin";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const result = await revokeRedeemCode(id, session.userId);
    return NextResponse.json({
      message: "Kode redeem berhasil dicabut",
      code: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
