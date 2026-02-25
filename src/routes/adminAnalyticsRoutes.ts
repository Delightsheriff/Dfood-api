import { Router } from "express";
import { getAdminAnalytics } from "../controllers/adminAnalyticsController";
import { protect, restrictTo } from "../middleware/auth";
import { UserRole } from "../types/auth";

const router = Router();

router.get("/", protect, restrictTo(UserRole.ADMIN), getAdminAnalytics);

export default router;
