import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { recordViolation } from "@/services/tryout";
import { recordViolationSchema } from "@/lib/validators/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const { attemptId } = await params;
    const body = await request.json();
    const validated = recordViolationSchema.parse(body);

    const result = await recordViolation(
      session.userId,
      attemptId,
      validated.type,
      validated.detail
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
