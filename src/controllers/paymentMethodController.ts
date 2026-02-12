import { Request, Response } from "express";
import { paymentMethodService } from "../services/paymentMethodService";
import { asyncHandler } from "../utils/asyncHandler";
import { addCardSchema } from "../types/payment";

export const addCard = asyncHandler(async (req: Request, res: Response) => {
  const data = addCardSchema.parse(req.body);
  const paymentMethod = await paymentMethodService.addCard(
    req.user!._id.toString(),
    data,
  );

  res.status(201).json({
    success: true,
    data: { paymentMethod },
    message: "Card added successfully",
  });
});

export const getAllPaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    const paymentMethods = await paymentMethodService.getAll(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { paymentMethods },
    });
  },
);

export const setDefaultPaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    const paymentMethod = await paymentMethodService.setDefault(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { paymentMethod },
    });
  },
);

export const deletePaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    await paymentMethodService.delete(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  },
);

export const getDefaultPaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    const paymentMethod = await paymentMethodService.getDefault(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { paymentMethod },
    });
  },
);
