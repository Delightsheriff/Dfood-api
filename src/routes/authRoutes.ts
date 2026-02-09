import { Router } from "express";
import passport from "../config/passport";
import {
  signup,
  createAdmin,
  signin,
  googleCallback,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getSession,
} from "../controllers/authController";
import { protect, restrictTo } from "../middleware/auth";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { UserRole } from "../types/auth";
// import { redisClient } from "../config/redis";

const router = Router();

// Public routes
router.post("/signup", authLimiter, signup);
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

// router.get("/debug/flush", async (req, res) => {
//   const client = redisClient.getClient();
//   if (client) {
//     await client.flushdb();
//     const keys = await client.keys("*");
//     res.json({ flushed: true, remainingKeys: keys });
//   } else {
//     res.json({ error: "No client" });
//   }
// });

export default router;
