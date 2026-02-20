import { Router } from "express";
import {
  getRestaurantOrders,
  getVendorOrderById,
  updateOrderStatus,
  getVendorOrderStats,
} from "../controllers/vendorOrderController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";

const router = Router();

// All routes require vendor role
router.get("/", protect, restrictTo(UserRole.VENDOR), getRestaurantOrders);
router.get("/stats", protect, restrictTo(UserRole.VENDOR), getVendorOrderStats);
router.get("/:id", protect, restrictTo(UserRole.VENDOR), getVendorOrderById);
router.patch(
  "/:id/status",
  protect,
  restrictTo(UserRole.VENDOR),
  updateOrderStatus,
);

export default router;
