import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import {
  exportTryoutQuestionsXlsx,
  exportTryoutQuestionsCsv,
} from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";

    if (format === "csv") {
      const csvContent = await exportTryoutQuestionsCsv(tryoutId);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="soal-tryout-${tryoutId}.csv"`,
        },
      });
    }

    // Default: Excel (.xlsx) dengan styling rapi dan sheet informasi
    const { buffer, filename } = await exportTryoutQuestionsXlsx(tryoutId);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
