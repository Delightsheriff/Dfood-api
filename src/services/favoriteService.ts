import Favorite from "../models/Favorite";
import FoodItem from "../models/FoodItem";
import { cacheService } from "./cacheService";
import { CACHE_TTL } from "../utils/cacheKeys";
import { NotFoundError, ConflictError } from "../types/errors";
import { checkIsOpen } from "../utils/timeUtils";

const FAVORITES_CACHE_KEY = (userId: string) => `favorites:user:${userId}`;

export class FavoriteService {
  async addFavorite(userId: string, foodItemId: string): Promise<void> {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    const existing = await Favorite.findOne({ userId, foodItemId });
    if (existing) {
      throw new ConflictError("Food item already in favorites");
    }

    await Favorite.create({ userId, foodItemId });

    // Invalidate cache
    await cacheService.delete(FAVORITES_CACHE_KEY(userId));
  }

  async removeFavorite(userId: string, foodItemId: string): Promise<void> {
    const favorite = await Favorite.findOne({ userId, foodItemId });

    if (!favorite) {
      throw new NotFoundError("Favorite not found");
    }

    await favorite.deleteOne();

    // Invalidate cache
    await cacheService.delete(FAVORITES_CACHE_KEY(userId));
  }

  async getFavorites(userId: string): Promise<any[]> {
    return cacheService.getOrSet(
      FAVORITES_CACHE_KEY(userId),
      async () => {
        const favorites = await Favorite.find({ userId })
          .populate({
            path: "foodItemId",
            populate: {
              path: "restaurantId",
              select:
                "name images address deliveryFee openingTime closingTime rating totalReviews",
            },
          })
          .sort({ createdAt: -1 })
          .lean();

        return favorites
          .filter((fav) => fav.foodItemId != null)
          .map((fav) => {
            const foodItem = fav.foodItemId as any;
            const restaurant = foodItem.restaurantId as any;

            return {
              _id: fav._id,
              foodItem: {
                ...foodItem,
                restaurant: restaurant
                  ? {
                      ...restaurant,
                      status: checkIsOpen(
                        restaurant.openingTime,
                        restaurant.closingTime,
                      )
                        ? "Open"
                        : "Closed",
                    }
                  : null,
              },
              createdAt: fav.createdAt,
            };
          });
      },
      CACHE_TTL.FOOD_ITEMS, // 30 minutes
    );
  }

  async checkIsFavorite(userId: string, foodItemId: string): Promise<boolean> {
    // Don't cache this - it's a single quick DB query (indexed)
    // Caching would add complexity (invalidation on every add/remove)
    const favorite = await Favorite.exists({ userId, foodItemId });
    return !!favorite;
  }
}

export const favoriteService = new FavoriteService();
