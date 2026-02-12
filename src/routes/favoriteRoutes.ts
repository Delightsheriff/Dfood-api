import { Router } from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkIsFavorite,
} from "../controllers/favoriteController";
import { protect } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.get("/", protect, getFavorites);
router.post("/:foodItemId", protect, addFavorite);
router.delete("/:foodItemId", protect, removeFavorite);
router.get("/:foodItemId/check", protect, checkIsFavorite);

export default router;
