import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const subscriptionStatus = await getUserSubscription(session.userId);

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        createdAt: session.user.createdAt,
      },
      subscription: subscriptionStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
