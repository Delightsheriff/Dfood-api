import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { vendorOrderService } from "../services/vendorOrderService";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

export const getRestaurantOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, startDate, endDate } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const orders = await vendorOrderService.getRestaurantOrders(
      req.user!._id.toString(),
      filters,
    );

    res.status(200).json({
      success: true,
      data: { orders },
    });
  },
);

export const getVendorOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await vendorOrderService.getOrderById(
      req.user!._id.toString(),
      req.params.id,
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updateStatusSchema.parse(req.body);

    const order = await vendorOrderService.updateOrderStatus(
      req.user!._id.toString(),
      req.params.id,
      status,
    );

    res.status(200).json({
      success: true,
      data: { order },
      message: "Order status updated successfully",
    });
  },
);

export const getVendorOrderStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await vendorOrderService.getOrderStats(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  },
);
