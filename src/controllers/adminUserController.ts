import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminUserService } from "../services/adminUserService";
import { NotFoundError } from "../types/errors";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, search } = req.query;

  const users = await adminUserService.getAllUsers({
    role: role as any,
    search: search as string,
  });

  res.status(200).json({
    success: true,
    data: { users },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminUserService.getUserById(req.params.id as string);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const getUserStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminUserService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  },
);
