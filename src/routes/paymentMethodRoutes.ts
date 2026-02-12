import { Router } from "express";
import {
  addCard,
  getAllPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getDefaultPaymentMethod,
} from "../controllers/paymentMethodController";
import { protect } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.post("/card", protect, addCard);
router.get("/", protect, getAllPaymentMethods);
router.get("/default", protect, getDefaultPaymentMethod);
router.patch("/:id/default", protect, setDefaultPaymentMethod);
router.delete("/:id", protect, deletePaymentMethod);

export default router;
