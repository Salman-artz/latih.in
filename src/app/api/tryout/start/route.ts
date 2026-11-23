import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { startOrResumeAttempt } from "@/services/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const result = await startOrResumeAttempt(session.userId, session.user.role);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
