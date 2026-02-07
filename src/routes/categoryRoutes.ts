import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { protect, restrictTo } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";
import { UserRole } from "../types/auth";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin-only routes
router.post(
  "/",
  protect,
  restrictTo(UserRole.ADMIN),
  uploadSingle,
  createCategory,
);

router.patch(
  "/:id",
  protect,
  restrictTo(UserRole.ADMIN),
  uploadSingle,
  updateCategory,
);

router.delete("/:id", protect, restrictTo(UserRole.ADMIN), deleteCategory);

export default router;
