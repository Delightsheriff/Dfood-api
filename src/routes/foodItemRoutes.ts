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

const router = Router();

// Public routes
router.get("/:id", getFoodItemById);
router.get("/restaurant/:restaurantId", getFoodItemsByRestaurant);
router.get("/category/:categoryId", getFoodItemsByCategory);

// Vendor routes
router.post(
  "/",
  protect,
  restrictTo(UserRole.VENDOR),
  uploadMultiple,
  createFoodItem,
);

router.get("/my/items", protect, restrictTo(UserRole.VENDOR), getMyFoodItems);

router.patch(
  "/:id",
  protect,
  restrictTo(UserRole.VENDOR),
  uploadMultiple,
  updateFoodItem,
);

router.delete(
  "/:id/images",
  protect,
  restrictTo(UserRole.VENDOR),
  deleteFoodItemImage,
);

router.delete("/:id", protect, restrictTo(UserRole.VENDOR), deleteFoodItem);

export default router;
