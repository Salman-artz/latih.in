import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { questionInputSchema } from "@/lib/validators/admin";
import { createAdminQuestion } from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(
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

    const { id: tryoutId } = await params;
    const body = await request.json();
    const validated = questionInputSchema.parse(body);

    const question = await createAdminQuestion(tryoutId, validated);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
