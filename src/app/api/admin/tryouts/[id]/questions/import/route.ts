import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { importTryoutQuestionsFromCsv } from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const { id: tryoutId } = await params;

    let csvText = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return errorResponse("File CSV tidak ditemukan", 400, "FILE_MISSING");
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = body.csvText || "";
    }

    if (!csvText || csvText.trim().length === 0) {
      return errorResponse("Isi file CSV tidak boleh kosong", 400, "EMPTY_CSV");
    }

    const result = await importTryoutQuestionsFromCsv(tryoutId, csvText);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
