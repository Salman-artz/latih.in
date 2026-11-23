import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserAttemptHistory } from "@/services/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const history = await getUserAttemptHistory(session.userId);
    return NextResponse.json({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
