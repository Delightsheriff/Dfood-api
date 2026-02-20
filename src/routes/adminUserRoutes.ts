import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getUserStats,
} from "../controllers/adminUserController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";

const router = Router();

// All routes require admin role
router.get("/", protect, restrictTo(UserRole.ADMIN), getAllUsers);
router.get("/stats", protect, restrictTo(UserRole.ADMIN), getUserStats);
router.get("/:id", protect, restrictTo(UserRole.ADMIN), getUserById);

export default router;
