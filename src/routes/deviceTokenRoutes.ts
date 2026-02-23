import { Router } from "express";
import {
  registerDeviceToken,
  unregisterDeviceToken,
} from "../controllers/deviceTokenController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", protect, registerDeviceToken);
router.post("/unregister", protect, unregisterDeviceToken);

export default router;
