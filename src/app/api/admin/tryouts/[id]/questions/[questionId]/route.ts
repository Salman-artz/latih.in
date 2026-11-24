import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { questionInputSchema } from "@/lib/validators/admin";
import { updateAdminQuestion, deleteAdminQuestion } from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const { id: tryoutId, questionId } = await params;
    const body = await request.json();
    const validated = questionInputSchema.parse(body);

    const updated = await updateAdminQuestion(tryoutId, questionId, validated);
    return NextResponse.json({ question: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const { id: tryoutId, questionId } = await params;
    const result = await deleteAdminQuestion(tryoutId, questionId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
