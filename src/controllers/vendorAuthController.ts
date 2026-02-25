import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { vendorAuthService } from "../services/vendorAuthService";
import { vendorSignupSchema } from "../types/vendorAuth";

export const vendorSignup = asyncHandler(
  async (req: Request, res: Response) => {
    const data = vendorSignupSchema.parse(req.body);

    const result = await vendorAuthService.createVendorWithRestaurant(data);

    res.status(201).json({
      success: true,
      data: result,
      message: "Vendor account created successfully",
    });
  },
);
