import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitAttempt } from "@/services/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const { attemptId } = await params;
    const result = await submitAttempt(session.userId, attemptId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
