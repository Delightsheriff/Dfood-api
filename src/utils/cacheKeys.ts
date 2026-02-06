/**
 * Centralized cache key definitions
 * TTL values in seconds
 */

export const CACHE_KEYS = {
  // Categories (rarely change)
  CATEGORIES_ALL: "categories:all",
  CATEGORY_BY_ID: (id: string) => `category:${id}`,

  // Restaurants
  RESTAURANT_BY_ID: (id: string) => `restaurant:${id}`,
  RESTAURANTS_OPEN: "restaurants:open",
  RESTAURANTS_BY_CATEGORY: (categoryId: string) =>
    `restaurants:category:${categoryId}`,

  // Food Items
  FOOD_BY_ID: (id: string) => `food:${id}`,
  FOOD_BY_CATEGORY: (categoryId: string) => `food:category:${categoryId}`,
  FOOD_BY_RESTAURANT: (restaurantId: string) =>
    `food:restaurant:${restaurantId}`,
};

export const CACHE_TTL = {
  CATEGORIES: 86400, // 24 hours (stable data)
  RESTAURANT_DETAILS: 3600, // 1 hour
  RESTAURANT_LIST: 300, // 5 minutes (status changes)
  FOOD_ITEMS: 1800, // 30 minutes
  SEARCH_RESULTS: 600, // 10 minutes
};
