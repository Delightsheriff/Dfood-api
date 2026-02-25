import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminAnalyticsService } from "../services/adminAnalyticsService";
import { ValidationError } from "../types/errors";

export const getAdminAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const { startDate, endDate, days } = req.query;

    let start: Date;
    let end: Date = new Date();

    if (startDate && endDate) {
      // Custom date range
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (days) {
      // Last N days
      const numDays = parseInt(days as string);
      start = new Date();
      start.setDate(start.getDate() - numDays);
    } else {
      // Default: last 30 days
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    // Validate dates
    if (start > end) {
      throw new ValidationError("Start date must be before end date");
    }

    const analytics = await adminAnalyticsService.getAnalytics(start, end);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
        },
        analytics,
      },
    });
  },
);
