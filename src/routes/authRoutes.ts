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
  googleCallback,
} from "../controllers/authController";
import { protect, restrictTo } from "../middleware/auth";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { UserRole } from "../types/auth";
import passport from "../config/passport";

const router = Router();

// Public routes
router.post("/signup", authLimiter, signup);
router.post("/vendor/signup", authLimiter, vendorSignup);
router.post("/signin", authLimiter, signin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/reset-password", authLimiter, resetPassword);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  googleCallback,
);

router.get("/google/failure", (_req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed",
  });
});

// Protected routes
router.get("/session", protect, getSession);
router.post("/admin/create", protect, restrictTo(UserRole.ADMIN), createAdmin);

export default router;
