import { Router } from "express";
import {
  signup,
  vendorSignup,
  createAdmin,
  signin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getSession,
} from "../controllers/authController";
import { protect, restrictTo } from "../middleware/auth";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { UserRole } from "../types/auth";

const router = Router();

// Public routes
router.post("/signup", authLimiter, signup);
router.post("/vendor/signup", authLimiter, vendorSignup);
router.post("/signin", authLimiter, signin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/reset-password", authLimiter, resetPassword);

// Protected routes
router.get("/session", protect, getSession);
router.post("/admin/create", protect, restrictTo(UserRole.ADMIN), createAdmin);

export default router;
