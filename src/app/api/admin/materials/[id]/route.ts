import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { updateAdminMaterial, archiveOrDeleteMaterial } from "@/services/admin";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function PUT(
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

    const updated = await updateAdminMaterial(id, body);
    return NextResponse.json({ material: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
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
    const archived = await archiveOrDeleteMaterial(id);
    return NextResponse.json({
      message: "Materi berhasil diarsipkan",
      material: archived,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
