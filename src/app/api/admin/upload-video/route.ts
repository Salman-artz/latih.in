import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { uploadVideoToCloudinary } from "@/lib/cloudinary";
import { errorResponse, handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Autentikasi diperlukan", 401, "UNAUTHORIZED");
    }
    if (session.user.role !== Role.ADMIN) {
      return errorResponse("Akses admin diperlukan", 403, "FORBIDDEN");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("File video tidak ditemukan dalam permintaan", 400, "FILE_MISSING");
    }

    // Validasi tipe video
    const mime = file.type;
    if (!mime.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      return errorResponse("Hanya file video (.mp4, .webm, .mov) yang diperbolehkan", 400, "INVALID_FILE_TYPE");
    }

    // Batas ukuran 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse("Ukuran file video maksimal 100MB", 400, "FILE_TOO_LARGE");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadVideoToCloudinary(buffer);

    return NextResponse.json({
      message: "Video berhasil diunggah ke Cloudinary",
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "";
    if (errMessage.includes("Must supply cloud_name")) {
      return errorResponse(
        "Cloud Name Cloudinary belum disetel. Silakan tambahkan CLOUDINARY_CLOUD_NAME di konfigurasi environment.",
        400,
        "CLOUDINARY_CLOUD_NAME_REQUIRED"
      );
    }
    return handleApiError(error);
  }
}
