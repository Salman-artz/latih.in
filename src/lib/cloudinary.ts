import { v2 as cloudinary } from "cloudinary";

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
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder,
        chunk_size: 6000000, // 6MB chunk
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            duration: result.duration,
          });
        } else {
          reject(new Error("Gagal mengunggah video ke Cloudinary"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary };
