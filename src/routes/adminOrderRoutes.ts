import { Router } from "express";
import {
  getAllOrders,
  getAdminOrderById,
  getAdminOrderStats,
} from "../controllers/adminOrderController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";

const router = Router();

// All routes require admin role
router.get("/", protect, restrictTo(UserRole.ADMIN), getAllOrders);
router.get("/stats", protect, restrictTo(UserRole.ADMIN), getAdminOrderStats);
router.get("/:id", protect, restrictTo(UserRole.ADMIN), getAdminOrderById);

export default router;
