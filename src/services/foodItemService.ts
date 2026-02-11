import FoodItem, { IFoodItem } from "../models/FoodItem";
import Restaurant from "../models/Restaurant";
import Category from "../models/Category";
import { cloudinaryService } from "./cloudinaryService";
import { cacheService } from "./cacheService";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys";
import { CreateFoodItemInput, UpdateFoodItemInput } from "../types/foodItem";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../types/errors";

export class FoodItemService {
  async create(
    userId: string,
    data: CreateFoodItemInput,
    imageBuffers: Buffer[],
  ): Promise<IFoodItem> {
    // Get user's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: userId });
    if (!restaurant) {
      throw new ForbiddenError(
        "You must have a restaurant to create food items",
      );
    }

    // Validate categories exist
    const categories = await Category.find({ _id: { $in: data.categoryIds } });
    if (categories.length !== data.categoryIds.length) {
      throw new ValidationError("One or more invalid category IDs");
    }

    // Require at least one image
    if (imageBuffers.length === 0) {
      throw new ValidationError("At least one food image is required");
    }

    // Upload images
    const imageUrls = await cloudinaryService.uploadImages(
      imageBuffers,
      "food-items",
    );

    // Create food item
    const foodItem = await FoodItem.create({
      ...data,
      restaurantId: restaurant._id,
      images: imageUrls,
    });

    // Update restaurant tags with new categories
    const newTags = [...new Set([...restaurant.tags, ...data.categoryIds])];
    if (newTags.length !== restaurant.tags.length) {
      restaurant.tags = newTags;
      await restaurant.save();
    }

    // Invalidate caches
    await cacheService.deletePattern("food:*");
    await cacheService.deletePattern("restaurants:*");
    await cacheService.delete(
      CACHE_KEYS.RESTAURANT_BY_ID(restaurant._id.toString()),
    );

    return foodItem;
  }

  // async getById(id: string): Promise<IFoodItem> {
  //   const foodItem = await cacheService.getOrSet(
  //     CACHE_KEYS.FOOD_BY_ID(id),
  //     async () => FoodItem.findById(id).lean(),
  //     CACHE_TTL.FOOD_ITEMS,
  //   );

  //   if (!foodItem) {
  //     throw new NotFoundError("Food item not found");
  //   }

  //   return foodItem as IFoodItem;
  // }

  async getById(id: string): Promise<IFoodItem> {
    const foodItem = await cacheService.getOrSet(
      CACHE_KEYS.FOOD_BY_ID(id),
      async () => {
        const item = await FoodItem.findById(id)
          .populate({
            path: "restaurantId",
            select:
              "name images address deliveryFee openingTime closingTime rating totalReviews",
          })
          .lean();

        if (!item) return null;

        // Manually compute status since lean() strips virtuals
        const restaurant = item.restaurantId as any;
        if (restaurant) {
          const now = new Date();
          const currMinutes = now.getHours() * 60 + now.getMinutes();
          const [openHour, openMin] = restaurant.openingTime
            .split(":")
            .map(Number);
          const [closeHour, closeMin] = restaurant.closingTime
            .split(":")
            .map(Number);
          const openMinutes = openHour * 60 + openMin;
          const closeMinutes = closeHour * 60 + closeMin;

          const isOpen =
            closeMinutes < openMinutes
              ? currMinutes >= openMinutes || currMinutes < closeMinutes
              : currMinutes >= openMinutes && currMinutes < closeMinutes;

          restaurant.status = isOpen ? "Open" : "Closed";
        }

        return item;
      },
      CACHE_TTL.FOOD_ITEMS,
    );

    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    return foodItem as IFoodItem;
  }

  async getByRestaurantId(restaurantId: string): Promise<IFoodItem[]> {
    return cacheService.getOrSet(
      CACHE_KEYS.FOOD_BY_RESTAURANT(restaurantId),
      async () =>
        FoodItem.find({ restaurantId }).sort({ createdAt: -1 }).lean(),
      CACHE_TTL.FOOD_ITEMS,
    );
  }

  async getMyFoodItems(userId: string): Promise<IFoodItem[]> {
    const restaurant = await Restaurant.findOne({ ownerId: userId });
    if (!restaurant) {
      return [];
    }

    return this.getByRestaurantId(restaurant._id.toString());
  }

  // async getByCategoryId(categoryId: string): Promise<any[]> {
  //   return cacheService.getOrSet(
  //     CACHE_KEYS.FOOD_BY_CATEGORY(categoryId),
  //     async () => {
  //       // Get food items in this category
  //       const foodItems = await FoodItem.find({
  //         categoryIds: categoryId,
  //       })
  //         .populate("restaurantId")
  //         .lean();

  //       // Filter to only show items from open restaurants
  //       return foodItems
  //         .filter((item) => {
  //           item.restaurantId != null;
  //           // const restaurant = item.restaurantId as any;
  //           // if (!restaurant) return false;

  //           // // Check if restaurant is open
  //           // const now = new Date();
  //           // const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  //           // const [openHour, openMin] = restaurant.openingTime
  //           //   .split(":")
  //           //   .map(Number);
  //           // const [closeHour, closeMin] = restaurant.closingTime
  //           //   .split(":")
  //           //   .map(Number);
  //           // const [currHour, currMin] = currentTime.split(":").map(Number);

  //           // const openMinutes = openHour * 60 + openMin;
  //           // const closeMinutes = closeHour * 60 + closeMin;
  //           // const currMinutes = currHour * 60 + currMin;

  //           // if (closeMinutes < openMinutes) {
  //           //   return currMinutes >= openMinutes || currMinutes < closeMinutes;
  //           // }

  //           // return currMinutes >= openMinutes && currMinutes < closeMinutes;
  //         })
  //         .map((item) => ({
  //           ...item,
  //           restaurant: item.restaurantId,
  //         }));
  //     },
  //     CACHE_TTL.FOOD_ITEMS,
  //   );
  // }
  async getByCategoryId(categoryId: string): Promise<any[]> {
    return cacheService.getOrSet(
      CACHE_KEYS.FOOD_BY_CATEGORY(categoryId),
      async () => {
        const foodItems = await FoodItem.find({
          categoryIds: categoryId,
        })
          .populate("restaurantId")
          .lean();

        return foodItems
          .filter((item) => item.restaurantId != null)
          .map((item) => ({
            ...item,
            restaurant: item.restaurantId,
          }));
      },
      CACHE_TTL.FOOD_ITEMS,
    );
  }

  async update(
    id: string,
    userId: string,
    data: UpdateFoodItemInput,
    imageBuffers?: Buffer[],
  ): Promise<IFoodItem> {
    const foodItem = await FoodItem.findById(id).populate("restaurantId");

    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    const restaurant = foodItem.restaurantId as any;
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError(
        "You can only update food items from your own restaurant",
      );
    }

    // Validate categories if updating
    if (data.categoryIds) {
      const categories = await Category.find({
        _id: { $in: data.categoryIds },
      });
      if (categories.length !== data.categoryIds.length) {
        throw new ValidationError("One or more invalid category IDs");
      }
    }

    // Upload new images if provided
    if (imageBuffers && imageBuffers.length > 0) {
      const newImageUrls = await cloudinaryService.uploadImages(
        imageBuffers,
        "food-items",
      );
      foodItem.images = [...foodItem.images, ...newImageUrls];

      // Limit to 5 images max
      if (foodItem.images.length > 5) {
        const toDelete = foodItem.images.slice(0, foodItem.images.length - 5);
        foodItem.images = foodItem.images.slice(-5);

        cloudinaryService
          .deleteImages(toDelete)
          .catch((err) =>
            console.error("Failed to delete old food images:", err),
          );
      }
    }

    // Update fields
    if (data.name) foodItem.name = data.name;
    if (data.description) foodItem.description = data.description;
    if (data.price !== undefined) foodItem.price = data.price;
    if (data.categoryIds) foodItem.categoryIds = data.categoryIds;
    if (data.calories !== undefined) foodItem.calories = data.calories;

    await foodItem.save();

    // Update restaurant tags if categories changed
    if (data.categoryIds) {
      await this.updateRestaurantTags(restaurant._id);
    }

    // Invalidate caches
    await cacheService.deletePattern("food:*");
    await cacheService.delete(
      CACHE_KEYS.RESTAURANT_BY_ID(restaurant._id.toString()),
    );

    return foodItem;
  }

  async deleteImage(
    id: string,
    userId: string,
    imageUrl: string,
  ): Promise<IFoodItem> {
    const foodItem = await FoodItem.findById(id).populate("restaurantId");

    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    const restaurant = foodItem.restaurantId as any;
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError(
        "You can only update food items from your own restaurant",
      );
    }

    if (foodItem.images.length <= 1) {
      throw new ValidationError("Food item must have at least one image");
    }

    if (!foodItem.images.includes(imageUrl)) {
      throw new NotFoundError("Image not found in food item");
    }

    foodItem.images = foodItem.images.filter((img) => img !== imageUrl);
    await foodItem.save();

    cloudinaryService
      .deleteImage(imageUrl)
      .catch((err) => console.error("Failed to delete food image:", err));

    await cacheService.delete(CACHE_KEYS.FOOD_BY_ID(id));

    return foodItem;
  }

  async delete(id: string, userId: string): Promise<void> {
    const foodItem = await FoodItem.findById(id).populate("restaurantId");

    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    const restaurant = foodItem.restaurantId as any;
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError(
        "You can only delete food items from your own restaurant",
      );
    }

    // Delete all images
    if (foodItem.images.length > 0) {
      await cloudinaryService.deleteImages(foodItem.images);
    }

    await foodItem.deleteOne();

    // Update restaurant tags
    await this.updateRestaurantTags(restaurant._id);

    // Invalidate caches
    await cacheService.deletePattern("food:*");
    await cacheService.delete(
      CACHE_KEYS.RESTAURANT_BY_ID(restaurant._id.toString()),
    );
  }

  private async updateRestaurantTags(restaurantId: string): Promise<void> {
    const foodItems = await FoodItem.find({ restaurantId });
    const tags = [...new Set(foodItems.flatMap((item) => item.categoryIds))];

    await Restaurant.findByIdAndUpdate(restaurantId, { tags });
  }
}

export const foodItemService = new FoodItemService();
