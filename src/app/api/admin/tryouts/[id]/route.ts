import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { updateTryoutSchema } from "@/lib/validators/admin";
import {
  getAdminTryoutDetail,
  updateAdminTryout,
  deleteAdminTryout,
} from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(
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
    const tryout = await getAdminTryoutDetail(id);
    return NextResponse.json({ tryout });
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const validated = updateTryoutSchema.parse(body);

    const updated = await updateAdminTryout(id, validated);
    return NextResponse.json({ tryout: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
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
    await deleteAdminTryout(id);
    return NextResponse.json({ message: "Paket tryout berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
