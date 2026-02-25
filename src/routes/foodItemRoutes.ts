import { Router } from "express";
import {
  createFoodItem,
  getFoodItemById,
  getMyFoodItems,
  getFoodItemsByRestaurant,
  getFoodItemsByCategory,
  updateFoodItem,
  deleteFoodItemImage,
  deleteFoodItem,
} from "../controllers/foodItemController";
import { protect, restrictTo } from "../middleware/auth";
import { uploadMultiple } from "../middleware/upload";
import { UserRole } from "../types/auth";
import { requireCompleteProfile } from "../middleware/profileCompletion";

const router = Router();

// Public routes
router.get("/:id", getFoodItemById);
router.get("/restaurant/:restaurantId", getFoodItemsByRestaurant);
router.get("/category/:categoryId", getFoodItemsByCategory);

// Vendor routes - REQUIRE COMPLETE PROFILE
router.post(
  "/",
  protect,
  restrictTo(UserRole.VENDOR),
  requireCompleteProfile,
  uploadMultiple,
  createFoodItem,
);

router.get(
  "/my/items",
  protect,
  restrictTo(UserRole.VENDOR),
  requireCompleteProfile,
  getMyFoodItems,
);

router.patch(
  "/:id",
  protect,
  restrictTo(UserRole.VENDOR),
  requireCompleteProfile,
  uploadMultiple,
  updateFoodItem,
);

router.delete(
  "/:id/images",
  protect,
  restrictTo(UserRole.VENDOR),
  requireCompleteProfile,
  deleteFoodItemImage,
);

router.delete(
  "/:id",
  protect,
  restrictTo(UserRole.VENDOR),
  requireCompleteProfile,
  deleteFoodItem,
);

export default router;
