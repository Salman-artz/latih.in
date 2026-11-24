import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import {
  getQuestionTemplateXlsx,
  getQuestionTemplateCsv,
} from "@/services/admin-tryout";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";

    if (format === "csv") {
      const csvContent = getQuestionTemplateCsv();
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="template-soal-tryout.csv"',
        },
      });
    }

    // Default: Excel (.xlsx) dengan styling rapi & sheet petunjuk
    const xlsxBuffer = getQuestionTemplateXlsx();
    return new NextResponse(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-soal-tryout.xlsx"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
