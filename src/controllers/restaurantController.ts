import { Request, Response } from "express";
import { restaurantService } from "../services/restaurantService";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "../types/restaurant";
import { ValidationError } from "../types/errors";

export const createRestaurant = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ValidationError("At least one restaurant image is required");
    }

    const data = createRestaurantSchema.parse(req.body);
    const imageBuffers = files.map((f) => f.buffer);

    const restaurant = await restaurantService.create(
      req.user!._id.toString(),
      data,
      imageBuffers,
    );

    res.status(201).json({
      success: true,
      data: { restaurant },
    });
  },
);

export const getRestaurantById = asyncHandler(
  async (req: Request, res: Response) => {
    const restaurant = await restaurantService.getById(req.params.id as string);

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  },
);

export const getMyRestaurants = asyncHandler(
  async (req: Request, res: Response) => {
    const restaurants = await restaurantService.getByOwnerId(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { restaurants },
    });
  },
);

export const getAllRestaurants = asyncHandler(
  async (req: Request, res: Response) => {
    const isOpen = req.query.isOpen === "true";
    const restaurants = await restaurantService.getAll({
      isOpen: isOpen || undefined,
    });

    res.status(200).json({
      success: true,
      data: { restaurants },
    });
  },
);

export const updateRestaurant = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const data = updateRestaurantSchema.parse(req.body);
    const imageBuffers = files?.map((f) => f.buffer);

    const restaurant = await restaurantService.update(
      req.params.id as string,
      req.user!._id.toString(),
      data,
      imageBuffers,
    );

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  },
);

export const deleteRestaurantImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new ValidationError("Image URL is required");
    }

    const restaurant = await restaurantService.deleteImage(
      req.params.id as string,
      req.user!._id.toString(),
      imageUrl,
    );

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  },
);

export const deleteRestaurant = asyncHandler(
  async (req: Request, res: Response) => {
    await restaurantService.delete(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  },
);
