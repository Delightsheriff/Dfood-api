import { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderSchema } from "../types/order";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);
  const order = await orderService.create(req.user!._id.toString(), data);

  res.status(201).json({
    success: true,
    data: { order },
    message: "Order placed successfully",
  });
});

export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.getById(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.getMyOrders(req.user!._id.toString());

  res.status(200).json({
    success: true,
    data: { orders },
  });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancel(
    req.params.id as string,
    req.user!._id.toString(),
  );

  res.status(200).json({
    success: true,
    data: { order },
    message: "Order cancelled successfully",
  });
});

export const getOrderByNumber = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.getByOrderNumber(
      req.params.orderNumber as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);
