import { Router } from "express";
import {
  createRestaurant,
  getRestaurantById,
  getMyRestaurant,
  getAllRestaurants,
  updateRestaurant,
  deleteRestaurantImage,
  deleteRestaurant,
} from "../controllers/restaurantController";
import { protect, restrictTo } from "../middleware/auth";
import { uploadMultiple } from "../middleware/upload";
import { UserRole } from "../types/auth";

const router = Router();

// Public routes
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);

// Protected routes - any authenticated user can create (becomes vendor)
router.post("/", protect, uploadMultiple, createRestaurant);

// Vendor-only routes
router.get(
  "/my/restaurant",
  protect,
  restrictTo(UserRole.VENDOR),
  getMyRestaurant,
);

router.patch(
  "/:id",
  protect,
  restrictTo(UserRole.VENDOR),
  uploadMultiple,
  updateRestaurant,
);

router.delete(
  "/:id/images",
  protect,
  restrictTo(UserRole.VENDOR),
  deleteRestaurantImage,
);

router.delete("/:id", protect, restrictTo(UserRole.VENDOR), deleteRestaurant);

export default router;
