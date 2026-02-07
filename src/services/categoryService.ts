import Category, { ICategory } from "../models/Category";
import { cloudinaryService } from "./cloudinaryService";
import { cacheService } from "./cacheService";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys";
import { CreateCategoryInput, UpdateCategoryInput } from "../types/category";
import { ConflictError, NotFoundError } from "../types/errors";

export class CategoryService {
  async create(
    data: CreateCategoryInput,
    imageBuffer: Buffer,
  ): Promise<ICategory> {
    // Check duplicate name
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    });

    if (existing) {
      throw new ConflictError("Category name already exists");
    }

    // Upload image
    const imageUrl = await cloudinaryService.uploadImage(
      imageBuffer,
      "categories",
    );

    // Create category
    const category = await Category.create({
      ...data,
      image: imageUrl,
    });

    // Invalidate cache
    await cacheService.delete(CACHE_KEYS.CATEGORIES_ALL);

    return category;
  }

  async getAll(): Promise<ICategory[]> {
    return cacheService.getOrSet(
      CACHE_KEYS.CATEGORIES_ALL,
      async () => Category.find().sort({ name: 1 }).lean(),
      CACHE_TTL.CATEGORIES,
    );
  }

  async getById(id: string): Promise<ICategory> {
    const category = await cacheService.getOrSet(
      CACHE_KEYS.CATEGORY_BY_ID(id),
      async () => Category.findById(id).lean(),
      CACHE_TTL.CATEGORIES,
    );

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return category;
  }

  async update(
    id: string,
    data: UpdateCategoryInput,
    imageBuffer?: Buffer,
  ): Promise<ICategory> {
    const category = await Category.findById(id);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictError("Category name already exists");
      }
    }

    if (imageBuffer) {
      const oldImage = category.image;
      const newImageUrl = await cloudinaryService.uploadImage(
        imageBuffer,
        "categories",
      );

      category.image = newImageUrl;

      cloudinaryService
        .deleteImage(oldImage)
        .catch((err) =>
          console.error("Failed to delete old category image:", err),
        );
    }

    if (data.name) category.name = data.name;

    await category.save();

    await cacheService.delete(CACHE_KEYS.CATEGORIES_ALL);
    await cacheService.delete(CACHE_KEYS.CATEGORY_BY_ID(id));

    return category;
  }

  async delete(id: string): Promise<void> {
    const category = await Category.findById(id);

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // TODO: Check if category has food items (when FoodItem model exists)
    // const hasItems = await FoodItem.exists({ categoryIds: id });
    // if (hasItems) {
    //   throw new ValidationError('Cannot delete category with existing food items');
    // }

    // Delete image
    await cloudinaryService.deleteImage(category.image);

    // Delete category
    await category.deleteOne();

    // Invalidate cache
    await cacheService.delete(CACHE_KEYS.CATEGORIES_ALL);
    await cacheService.delete(CACHE_KEYS.CATEGORY_BY_ID(id));
  }
}

export const categoryService = new CategoryService();
