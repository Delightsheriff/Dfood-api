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
import { VendorStatus } from "../types/auth";

export class RestaurantService {
  async create(
    ownerId: string,
    data: CreateRestaurantInput,
    imageBuffers: Buffer[],
  ): Promise<IRestaurant> {
    // Verify owner is active vendor
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== "vendor") {
      throw new ForbiddenError("Only vendors can create restaurants");
    }

    if (owner.vendorStatus !== VendorStatus.ACTIVE) {
      throw new ForbiddenError(
        "Your vendor account must be active to create a restaurant",
      );
    }

    // Check if vendor already has a restaurant with same name
    const existing = await Restaurant.findOne({
      ownerId,
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    });

    if (existing) {
      throw new ConflictError("You already have a restaurant with this name");
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
      ownerId,
      images: imageUrls,
    });

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

        // Manually add status since lean() doesn't include virtuals
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

  async getByOwnerId(ownerId: string): Promise<IRestaurant[]> {
    const restaurants = await Restaurant.find({ ownerId }).sort({
      createdAt: -1,
    });
    return restaurants;
  }

  async getAll(filters?: {
    isOpen?: boolean;
  }): Promise<Array<IRestaurant & { status: string }>> {
    const cacheKey = filters?.isOpen
      ? CACHE_KEYS.RESTAURANTS_OPEN
      : "restaurants:all";

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const restaurants = await Restaurant.find()
          .sort({ rating: -1, name: 1 })
          .lean<IRestaurant[]>(); // Type hint for lean result

        // Add status to each restaurant
        return restaurants
          .map((rest) => {
            const instance = new Restaurant(rest);
            return {
              ...rest,
              status: instance.isOpen() ? "Open" : "Closed",
            } as IRestaurant & { status: string };
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

    // Verify ownership
    if (restaurant.ownerId.toString() !== ownerId) {
      throw new ForbiddenError("You can only update your own restaurants");
    }

    // Check name conflict if updating name
    if (data.name && data.name !== restaurant.name) {
      const existing = await Restaurant.findOne({
        ownerId,
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictError("You already have a restaurant with this name");
      }
    }

    // Upload new images if provided
    if (imageBuffers && imageBuffers.length > 0) {
      const newImageUrls = await cloudinaryService.uploadImages(
        imageBuffers,
        "restaurants",
      );
      restaurant.images = [...restaurant.images, ...newImageUrls];

      // Limit to 5 images max
      if (restaurant.images.length > 5) {
        const toDelete = restaurant.images.slice(
          0,
          restaurant.images.length - 5,
        );
        restaurant.images = restaurant.images.slice(-5);

        // Delete old images (non-blocking)
        cloudinaryService
          .deleteImages(toDelete)
          .catch((err) =>
            console.error("Failed to delete old restaurant images:", err),
          );
      }
    }

    // Update fields
    if (data.name) restaurant.name = data.name;
    if (data.description !== undefined)
      restaurant.description = data.description;
    if (data.address !== undefined) restaurant.address = data.address;
    if (data.deliveryFee !== undefined)
      restaurant.deliveryFee = data.deliveryFee;
    if (data.openingTime) restaurant.openingTime = data.openingTime;
    if (data.closingTime) restaurant.closingTime = data.closingTime;

    await restaurant.save();

    // Invalidate cache
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
      throw new ForbiddenError("You can only update your own restaurants");
    }

    if (restaurant.images.length <= 1) {
      throw new ValidationError("Restaurant must have at least one image");
    }

    if (!restaurant.images.includes(imageUrl)) {
      throw new NotFoundError("Image not found in restaurant");
    }

    // Remove image from array
    restaurant.images = restaurant.images.filter((img) => img !== imageUrl);
    await restaurant.save();

    // Delete from Cloudinary (non-blocking)
    cloudinaryService
      .deleteImage(imageUrl)
      .catch((err) => console.error("Failed to delete restaurant image:", err));

    // Invalidate cache
    await cacheService.delete(CACHE_KEYS.RESTAURANT_BY_ID(id));

    return restaurant;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (restaurant.ownerId.toString() !== ownerId) {
      throw new ForbiddenError("You can only delete your own restaurants");
    }

    // TODO: Check if restaurant has food items or active orders
    // const hasItems = await FoodItem.exists({ restaurantId: id });
    // if (hasItems) {
    //   throw new ValidationError('Cannot delete restaurant with existing menu items');
    // }

    // Delete all images
    if (restaurant.images.length > 0) {
      await cloudinaryService.deleteImages(restaurant.images);
    }

    await restaurant.deleteOne();

    // Invalidate cache
    await cacheService.deletePattern("restaurants:*");
    await cacheService.delete(CACHE_KEYS.RESTAURANT_BY_ID(id));
  }
}

export const restaurantService = new RestaurantService();
