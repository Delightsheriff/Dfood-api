import { Router } from "express";
import { dashboardSearch } from "../controllers/dashboardSearchController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";
import rateLimit from "express-rate-limit";

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.get(
  "/",
  protect,
  restrictTo(UserRole.ADMIN, UserRole.VENDOR),
  searchLimiter,
  dashboardSearch,
);

export default router;
