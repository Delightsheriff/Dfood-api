import { Request, Response, NextFunction } from "express";
import Restaurant from "../models/Restaurant";
import { ForbiddenError } from "../types/errors";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Middleware to ensure vendor has completed their restaurant profile
 * before accessing certain features (like creating food items)
 */
export const requireCompleteProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: req.user!._id });

    if (!restaurant) {
      throw new ForbiddenError("You must create a restaurant first");
    }

    if (!restaurant.isProfileComplete) {
      throw new ForbiddenError(
        "Please complete your restaurant profile (add images) before accessing this feature",
      );
    }

    // Attach restaurant to request for use in controllers
    req.restaurant = restaurant;
    next();
  },
);

// Type augmentation for Request
declare global {
  namespace Express {
    interface Request {
      restaurant?: any;
    }
  }
}
