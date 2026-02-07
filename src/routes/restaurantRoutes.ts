import { Router } from "express";
import {
  createRestaurant,
  getRestaurantById,
  getMyRestaurants,
  getAllRestaurants,
  updateRestaurant,
  deleteRestaurantImage,
  deleteRestaurant,
} from "../controllers/restaurantController";
import { protect, requireActiveVendor } from "../middleware/auth";
import { uploadMultiple } from "../middleware/upload";

const router = Router();

// Public routes
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);

// Vendor routes (protected)
router.post(
  "/",
  protect,
  requireActiveVendor,
  uploadMultiple,
  createRestaurant,
);

router.get("/my/restaurants", protect, requireActiveVendor, getMyRestaurants);

router.patch(
  "/:id",
  protect,
  requireActiveVendor,
  uploadMultiple,
  updateRestaurant,
);

router.delete(
  "/:id/images",
  protect,
  requireActiveVendor,
  deleteRestaurantImage,
);

router.delete("/:id", protect, requireActiveVendor, deleteRestaurant);

export default router;
