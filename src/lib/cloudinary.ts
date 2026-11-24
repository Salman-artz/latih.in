import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import os from "os";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || "QGewUWpRCdJ4_O10fz1X9omibtg",
  api_secret: process.env.CLOUDINARY_API_SECRET || "QGewUWpRCdJ4_O10fz1X9omibtg",
  secure: true,
});

export async function uploadVideoToCloudinary(
  buffer: Buffer,
  folder = "latih-in/materials"
): Promise<{ url: string; publicId: string; duration?: number }> {
  // Simpan buffer ke temporary file di disk untuk chunked upload_large (efisien untuk file besar s/d 300MB)
  const tempFilePath = path.join(
    os.tmpdir(),
    `upload-${Date.now()}-${Math.random().toString(36).substring(2)}.mp4`
  );
  await fs.promises.writeFile(tempFilePath, buffer);

  try {
    const result = (await cloudinary.uploader.upload_large(tempFilePath, {
      resource_type: "video",
      folder,
      chunk_size: 20000000, // 20MB per chunk
    })) as UploadApiResponse;

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } finally {
    // Selalu hapus file sementara dari disk setelah selesai
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
}

export { cloudinary };
