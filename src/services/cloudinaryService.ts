import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload single image from buffer
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = "food-app",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // Max dimensions
            { quality: "auto" }, // Auto quality
            { fetch_format: "auto" }, // Auto format (WebP if supported)
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images from buffers
   */
  async uploadImages(
    buffers: Buffer[],
    folder: string = "food-app",
  ): Promise<string[]> {
    const uploadPromises = buffers.map((buffer) =>
      this.uploadImage(buffer, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image by URL
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      const parts = imageUrl.split("/");
      const fileWithExt = parts[parts.length - 1];
      const publicId = `${parts[parts.length - 2]}/${fileWithExt.split(".")[0]}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      throw error;
    }
  }

  /**
   * Delete multiple images
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteImage(url));
    await Promise.all(deletePromises);
  }
}

export const cloudinaryService = new CloudinaryService();
