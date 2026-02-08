import { Request, Response } from "express";
import { foodItemService } from "../services/foodItemService";
import { asyncHandler } from "../utils/asyncHandler";
import { createFoodItemSchema, updateFoodItemSchema } from "../types/foodItem";
import { ValidationError } from "../types/errors";

export const createFoodItem = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("Creating food item with data:", req.body);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ValidationError("At least one food image is required");
    }

    const data = createFoodItemSchema.parse(req.body);
    const imageBuffers = files.map((f) => f.buffer);

    const foodItem = await foodItemService.create(
      req.user!._id.toString(),
      data,
      imageBuffers,
    );

    res.status(201).json({
      success: true,
      data: { foodItem },
    });
  },
);

export const getFoodItemById = asyncHandler(
  async (req: Request, res: Response) => {
    const foodItem = await foodItemService.getById(req.params.id as string);

    res.status(200).json({
      success: true,
      data: { foodItem },
    });
  },
);

export const getMyFoodItems = asyncHandler(
  async (req: Request, res: Response) => {
    const foodItems = await foodItemService.getMyFoodItems(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { foodItems },
    });
  },
);

export const getFoodItemsByRestaurant = asyncHandler(
  async (req: Request, res: Response) => {
    const foodItems = await foodItemService.getByRestaurantId(
      req.params.restaurantId as string,
    );

    res.status(200).json({
      success: true,
      data: { foodItems },
    });
  },
);

export const getFoodItemsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const foodItems = await foodItemService.getByCategoryId(
      req.params.categoryId as string,
    );

    res.status(200).json({
      success: true,
      data: { foodItems },
    });
  },
);

export const updateFoodItem = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const data = updateFoodItemSchema.parse(req.body);
    const imageBuffers = files?.map((f) => f.buffer);

    const foodItem = await foodItemService.update(
      req.params.id as string,
      req.user!._id.toString(),
      data,
      imageBuffers,
    );

    res.status(200).json({
      success: true,
      data: { foodItem },
    });
  },
);

export const deleteFoodItemImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new ValidationError("Image URL is required");
    }

    const foodItem = await foodItemService.deleteImage(
      req.params.id as string,
      req.user!._id.toString(),
      imageUrl,
    );

    res.status(200).json({
      success: true,
      data: { foodItem },
    });
  },
);

export const deleteFoodItem = asyncHandler(
  async (req: Request, res: Response) => {
    await foodItemService.delete(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      message: "Food item deleted successfully",
    });
  },
);
