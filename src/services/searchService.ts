import Restaurant from "../models/Restaurant";
import FoodItem from "../models/FoodItem";
import { cacheService } from "./cacheService";
import { CACHE_TTL } from "../utils/cacheKeys";
import { checkIsOpen } from "../utils/timeUtils";

export class SearchService {
  async search(query: string): Promise<{ foods: any[]; restaurants: any[] }> {
    const trimmed = query.trim();

    return cacheService.getOrSet(
      `search:${trimmed.toLowerCase()}`,
      async () => {
        const regex = new RegExp(trimmed, "i");

        // Run both queries in parallel
        const [foods, restaurants] = await Promise.all([
          FoodItem.find({
            $or: [{ name: regex }, { description: regex }],
          })
            .populate({
              path: "restaurantId",
              select:
                "name images address deliveryFee openingTime closingTime rating totalReviews",
            })
            .lean(),

          Restaurant.find({
            name: regex,
          }).lean(),
        ]);

        // Attach status to each food item's restaurant
        const mappedFoods = foods
          .filter((item) => item.restaurantId != null)
          .map((item) => {
            const restaurant = item.restaurantId as any;
            return {
              ...item,
              restaurant: {
                ...restaurant,
                status: checkIsOpen(
                  restaurant.openingTime,
                  restaurant.closingTime,
                )
                  ? "Open"
                  : "Closed",
              },
            };
          });

        // Sort restaurants: open first, closed after
        const mappedRestaurants = restaurants
          .map((r) => ({
            ...r,
            status: checkIsOpen(r.openingTime, r.closingTime)
              ? "Open"
              : "Closed",
          }))
          .sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === "Open" ? -1 : 1;
          });

        return { foods: mappedFoods, restaurants: mappedRestaurants };
      },
      CACHE_TTL.SEARCH_RESULTS,
    );
  }
}

export const searchService = new SearchService();
