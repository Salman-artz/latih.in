import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { updateRedeemCodeSchema } from "@/lib/validators/admin";
import { updateRedeemCode } from "@/services/admin";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const validated = updateRedeemCodeSchema.parse(body);

    const updated = await updateRedeemCode(id, {
      code: validated.code,
      durationDays: validated.durationDays,
      maxUses: validated.maxUses,
      label: validated.label,
      expiresAt:
        validated.expiresAt !== undefined
          ? validated.expiresAt
            ? new Date(validated.expiresAt)
            : null
          : undefined,
    });

    return NextResponse.json({
      message: "Kode redeem berhasil diperbarui",
      code: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
