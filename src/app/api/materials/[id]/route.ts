import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMaterialDetailForUser } from "@/services/material";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const material = await getMaterialDetailForUser(session.userId, id);
    return NextResponse.json({ material });
  } catch (error) {
    return handleApiError(error);
  }
}
