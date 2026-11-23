import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMaterialsForUser } from "@/services/material";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const materials = await getMaterialsForUser(session.userId);
    return NextResponse.json({ materials });
  } catch (error) {
    return handleApiError(error);
  }
}
