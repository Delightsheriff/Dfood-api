import multer from "multer";
import { Request } from "express";
import { ValidationError } from "../types/errors";

// Memory storage (upload to Cloudinary from buffer)
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError("Only JPEG, PNG, and WebP images are allowed"));
  }
};

// Single image upload
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("image");

// Multiple images upload (max 5)
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
}).array("images", 5);

// Helper to handle multer errors
export const handleUploadError = (err: any, fieldName: string = "image") => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      throw new ValidationError("File size exceeds 5MB limit");
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      throw new ValidationError("Maximum 5 images allowed");
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      throw new ValidationError(`Unexpected field: ${fieldName}`);
    }
  }
  throw err;
};
