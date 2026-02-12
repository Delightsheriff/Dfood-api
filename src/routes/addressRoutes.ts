import { Router } from "express";
import {
  createAddress,
  getAllAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getDefaultAddress,
} from "../controllers/addressController";
import { protect } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.post("/", protect, createAddress);
router.get("/", protect, getAllAddresses);
router.get("/default", protect, getDefaultAddress);
router.get("/:id", protect, getAddressById);
router.patch("/:id", protect, updateAddress);
router.patch("/:id/default", protect, setDefaultAddress);
router.delete("/:id", protect, deleteAddress);

export default router;
