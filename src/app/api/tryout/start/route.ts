import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { startOrResumeAttempt } from "@/services/tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    // Rate limiting attempt tryout per user
    await checkRateLimit({ key: `tryout-start:${session.userId}`, limit: 10, windowSeconds: 60 });

    let tryoutId: string | undefined;
    try {
      const body = await request.json();
      if (body?.tryoutId && typeof body.tryoutId === "string") {
        tryoutId = body.tryoutId;
      }
    } catch {
      // Body may be empty, proceed with fallback
    }

    const result = await startOrResumeAttempt(session.userId, session.user.role, tryoutId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
