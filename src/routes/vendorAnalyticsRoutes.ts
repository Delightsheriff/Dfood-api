import { Router } from "express";
import { getVendorAnalytics } from "../controllers/vendorAnalyticsController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";

const router = Router();

router.get("/", protect, restrictTo(UserRole.VENDOR), getVendorAnalytics);

export default router;
