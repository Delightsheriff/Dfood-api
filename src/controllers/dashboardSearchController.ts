import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { dashboardSearchService } from "../services/dashboardSearchService";
import { ValidationError } from "../types/errors";
import { UserRole } from "../types/auth";

export const dashboardSearch = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      throw new ValidationError("Search query must be at least 2 characters");
    }

    const userRole = req.user!.role;
    let results;

    if (userRole === UserRole.ADMIN) {
      // Admin can search everything
      results = await dashboardSearchService.adminSearch(query);
    } else if (userRole === UserRole.VENDOR) {
      // Vendor can only search their own data
      results = await dashboardSearchService.vendorSearch(
        req.user!._id.toString(),
        query,
      );
    } else {
      // Customers shouldn't access this endpoint
      throw new ValidationError("Unauthorized");
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  },
);
