import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveAnswers } from "@/services/tryout";
import { saveAnswersSchema } from "@/lib/validators/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function PUT(
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
    const validated = saveAnswersSchema.parse(body);

    const result = await saveAnswers(session.userId, attemptId, validated.answers);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
