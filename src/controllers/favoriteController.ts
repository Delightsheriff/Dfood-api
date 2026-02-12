import { Request, Response } from "express";
import { favoriteService } from "../services/favoriteService";
import { asyncHandler } from "../utils/asyncHandler";

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  await favoriteService.addFavorite(
    req.user!._id.toString(),
    req.params.foodItemId as string,
  );

  res.status(201).json({
    success: true,
    message: "Food item added to favorites",
  });
});

export const removeFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    await favoriteService.removeFavorite(
      req.user!._id.toString(),
      req.params.foodItemId as string,
    );

    res.status(200).json({
      success: true,
      message: "Food item removed from favorites",
    });
  },
);

export const getFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const favorites = await favoriteService.getFavorites(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { favorites },
    });
  },
);

export const checkIsFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const isFavorite = await favoriteService.checkIsFavorite(
      req.user!._id.toString(),
      req.params.foodItemId as string,
    );

    res.status(200).json({
      success: true,
      data: { isFavorite },
    });
  },
);
