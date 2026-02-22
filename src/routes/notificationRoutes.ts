import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

// All routes require authentication (vendor or admin)
router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/mark-all-read", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
