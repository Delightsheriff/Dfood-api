import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  deleteProfileImage,
} from "../controllers/profileController";
import { protect } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";

const router = Router();

// All routes require authentication
router.get("/", protect, getProfile);
router.patch("/", protect, updateProfile);
router.post("/image", protect, uploadSingle, updateProfileImage);
router.delete("/image", protect, deleteProfileImage);

export default router;
