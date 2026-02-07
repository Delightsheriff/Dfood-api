import { Request, Response } from "express";
import { categoryService } from "../services/categoryService";
import { asyncHandler } from "../utils/asyncHandler";
import { createCategorySchema, updateCategorySchema } from "../types/category";
import { ValidationError } from "../types/errors";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError("Category image is required");
    }

    const data = createCategorySchema.parse(req.body);
    const category = await categoryService.create(data, req.file.buffer);

    res.status(201).json({
      success: true,
      data: { category },
    });
  },
);

export const getAllCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await categoryService.getAll();

    res.status(200).json({
      success: true,
      data: { categories },
    });
  },
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id as string);

    res.status(200).json({
      success: true,
      data: { category },
    });
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(
      req.params.id as string,
      data,
      req.file?.buffer,
    );

    res.status(200).json({
      success: true,
      data: { category },
    });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    await categoryService.delete(req.params.id as string);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  },
);
