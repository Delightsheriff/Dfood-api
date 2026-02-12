import Favorite from "../models/Favorite";
import FoodItem from "../models/FoodItem";
import { NotFoundError, ConflictError } from "../types/errors";
import { checkIsOpen } from "../utils/timeUtils";

export class FavoriteService {
  async addFavorite(userId: string, foodItemId: string): Promise<void> {
    // Check if food item exists
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      throw new NotFoundError("Food item not found");
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId, foodItemId });
    if (existing) {
      throw new ConflictError("Food item already in favorites");
    }

    await Favorite.create({ userId, foodItemId });
  }

  async removeFavorite(userId: string, foodItemId: string): Promise<void> {
    const favorite = await Favorite.findOne({ userId, foodItemId });

    if (!favorite) {
      throw new NotFoundError("Favorite not found");
    }

    await favorite.deleteOne();
  }

  async getFavorites(userId: string): Promise<any[]> {
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

    // Filter out deleted food items and attach restaurant status
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
  }

  async checkIsFavorite(userId: string, foodItemId: string): Promise<boolean> {
    const favorite = await Favorite.exists({ userId, foodItemId });
    return !!favorite;
  }
}

export const favoriteService = new FavoriteService();
