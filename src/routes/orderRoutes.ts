import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getMyOrders,
  cancelOrder,
  getOrderByNumber,
} from "../controllers/orderController";
import { protect } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/number/:orderNumber", protect, getOrderByNumber);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, cancelOrder);

export default router;
