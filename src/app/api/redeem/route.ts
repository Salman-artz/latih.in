import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redeemSchema } from "@/lib/validators/redeem";
import { checkRateLimit } from "@/lib/rate-limit";
import { redeemCode } from "@/services/redeem";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    if (session.user.role === "ADMIN") {
      return errorResponse(
        "Administrator tidak dapat melakukan redeem kode atau berlangganan. Fitur ini khusus untuk akun Siswa.",
        403,
        "ADMIN_CANNOT_REDEEM"
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await checkRateLimit({ key: `redeem:${ip}`, limit: 10, windowSeconds: 60 });

    const body = await request.json();
    const validated = redeemSchema.parse(body);

    const result = await redeemCode(session.userId, validated.code);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
