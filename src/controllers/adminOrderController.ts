import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminOrderService } from "../services/adminOrderService";

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, restaurantId, startDate, endDate } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (restaurantId) filters.restaurantId = restaurantId;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const orders = await adminOrderService.getAllOrders(filters);

    res.status(200).json({
      success: true,
      data: { orders },
    });
  },
);

export const getAdminOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await adminOrderService.getOrderById(req.params.id as string);

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);

export const getAdminOrderStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminOrderService.getOrderStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  },
);
