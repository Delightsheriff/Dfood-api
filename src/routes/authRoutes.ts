import { Router } from "express";
import {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  getSession,
} from "../controllers/authController";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { protect } from "../middleware/auth";
const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/signin", authLimiter, signin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/session", protect, getSession);

export default router;
