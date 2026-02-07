import Restaurant, { IRestaurant } from "../models/Restaurant";
import User from "../models/User";
import { cloudinaryService } from "./cloudinaryService";
import { cacheService } from "./cacheService";
import { CACHE_KEYS, CACHE_TTL } from "../utils/cacheKeys";
import {
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from "../types/restaurant";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../types/errors";
import { UserRole } from "../types/auth";
import { Document } from "mongoose";

export class RestaurantService {
  async create(
    userId: string,
    data: CreateRestaurantInput,
    imageBuffers: Buffer[],
  ): Promise<IRestaurant> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user already has a restaurant (V1: one restaurant per vendor)
    if (user.role === UserRole.VENDOR) {
      const existingRestaurant = await Restaurant.findOne({ ownerId: userId });
      if (existingRestaurant) {
        throw new ConflictError(
          "You already have a restaurant. Multiple restaurants not supported in V1.",
        );
      }
    }

    // Require at least one image
    if (imageBuffers.length === 0) {
      throw new ValidationError("At least one restaurant image is required");
    }

    // Upload images
    const imageUrls = await cloudinaryService.uploadImages(
      imageBuffers,
      "restaurants",
    );

    // Create restaurant
    const restaurant = await Restaurant.create({
      ...data,
      ownerId: userId,
      images: imageUrls,
    });

    // Auto-upgrade user to vendor if they're currently a customer
    if (user.role === UserRole.CUSTOMER) {
      user.role = UserRole.VENDOR;
      await user.save();
    }

    // Invalidate cache
    await cacheService.deletePattern("restaurants:*");

    return restaurant;
  }

  async getById(id: string): Promise<IRestaurant> {
    const restaurant = await cacheService.getOrSet(
      CACHE_KEYS.RESTAURANT_BY_ID(id),
      async () => {
        const rest = await Restaurant.findById(id).lean();
        if (!rest) return null;

        const instance = new Restaurant(rest);
        return {
          ...rest,
          status: instance.isOpen() ? "Open" : "Closed",
        };
      },
      CACHE_TTL.RESTAURANT_DETAILS,
    );

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    return restaurant as unknown as IRestaurant;
  }

  async getByOwnerId(ownerId: string): Promise<IRestaurant | null> {
    const restaurant = await Restaurant.findOne({ ownerId });
    return restaurant;
  }

  async getAll(filters?: {
    isOpen?: boolean;
  }): Promise<Array<Omit<IRestaurant, keyof Document> & { status: string }>> {
    const cacheKey = filters?.isOpen
      ? CACHE_KEYS.RESTAURANTS_OPEN
      : "restaurants:all";

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const restaurants = await Restaurant.find()
          .sort({ rating: -1, name: 1 })
          .lean();

        return restaurants
          .map((rest) => {
            const instance = new Restaurant(rest);
            return {
              ...rest,
              status: instance.isOpen() ? "Open" : "Closed",
            };
          })
          .filter((rest) => {
            if (filters?.isOpen) {
              return rest.status === "Open";
            }
            return true;
          });
      },
      CACHE_TTL.RESTAURANT_LIST,
    );
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateRestaurantInput,
    imageBuffers?: Buffer[],
  ): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.ownerId.toString() !== ownerId) {
      throw new ForbiddenError("You can only update your own restaurant");
    }

    if (imageBuffers && imageBuffers.length > 0) {
      const newImageUrls = await cloudinaryService.uploadImages(
        imageBuffers,
        "restaurants",
      );
      restaurant.images = [...restaurant.images, ...newImageUrls];

      if (restaurant.images.length > 5) {
        const toDelete = restaurant.images.slice(
          0,
          restaurant.images.length - 5,
        );
        restaurant.images = restaurant.images.slice(-5);

        cloudinaryService
          .deleteImages(toDelete)
          .catch((err) =>
            console.error("Failed to delete old restaurant images:", err),
          );
      }
    }

    if (data.name) restaurant.name = data.name;
    if (data.description !== undefined)
      restaurant.description = data.description;
    if (data.address !== undefined) restaurant.address = data.address;
    if (data.deliveryFee !== undefined)
      restaurant.deliveryFee = data.deliveryFee;
    if (data.openingTime) restaurant.openingTime = data.openingTime;
    if (data.closingTime) restaurant.closingTime = data.closingTime;

    await restaurant.save();

    await cacheService.deletePattern("restaurants:*");
    await cacheService.delete(CACHE_KEYS.RESTAURANT_BY_ID(id));

    return restaurant;
  }

  async deleteImage(
    id: string,
    ownerId: string,
    imageUrl: string,
  ): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.ownerId.toString() !== ownerId) {
      throw new ForbiddenError("You can only update your own restaurant");
    }

    if (restaurant.images.length <= 1) {
      throw new ValidationError("Restaurant must have at least one image");
    }

    if (!restaurant.images.includes(imageUrl)) {
      throw new NotFoundError("Image not found in restaurant");
    }

    restaurant.images = restaurant.images.filter((img) => img !== imageUrl);
    await restaurant.save();

    cloudinaryService
      .deleteImage(imageUrl)
      .catch((err) => console.error("Failed to delete restaurant image:", err));

    await cacheService.delete(CACHE_KEYS.RESTAURANT_BY_ID(id));

    return restaurant;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.ownerId.toString() !== ownerId) {
      throw new ForbiddenError("You can only delete your own restaurant");
    }

    // TODO: Check if restaurant has food items or active orders

    if (restaurant.images.length > 0) {
      await cloudinaryService.deleteImages(restaurant.images);
    }

    await restaurant.deleteOne();

    await cacheService.deletePattern("restaurants:*");
    await cacheService.delete(CACHE_KEYS.RESTAURANT_BY_ID(id));
  }
}

export const restaurantService = new RestaurantService();
