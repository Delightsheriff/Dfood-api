import User from "../models/User";
import Restaurant from "../models/Restaurant";
import Order from "../models/Order";
import FoodItem from "../models/FoodItem";

export class DashboardSearchService {
  /**
   * Admin search - searches across everything
   */
  async adminSearch(query: string) {
    const regex = new RegExp(query.trim(), "i");

    const [users, restaurants, orders, foodItems] = await Promise.all([
      // Search users
      User.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }],
      })
        .select("name email role phone createdAt")
        .limit(10)
        .lean(),

      // Search restaurants
      Restaurant.find({
        $or: [{ name: regex }, { address: regex }],
      })
        .select("name address images")
        .limit(10)
        .lean(),

      // Search orders by order number
      Order.find({ orderNumber: regex })
        .populate("customerId", "name email")
        .populate("restaurantId", "name")
        .select("orderNumber total status createdAt")
        .limit(10)
        .lean(),

      // Search food items
      FoodItem.find({
        $or: [{ name: regex }, { description: regex }],
      })
        .populate("restaurantId", "name")
        .select("name price images")
        .limit(10)
        .lean(),
    ]);

    return {
      users: users.map((u) => ({ ...u, type: "user" })),
      restaurants: restaurants.map((r) => ({ ...r, type: "restaurant" })),
      orders: orders.map((o) => ({ ...o, type: "order" })),
      foodItems: foodItems.map((f) => ({ ...f, type: "foodItem" })),
    };
  }

  /**
   * Vendor search - only searches their own data
   */
  async vendorSearch(vendorId: string, query: string) {
    const regex = new RegExp(query.trim(), "i");

    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      return { orders: [], foodItems: [] };
    }

    const [orders, foodItems] = await Promise.all([
      // Search vendor's orders by order number or customer name
      Order.find({
        restaurantId: restaurant._id,
        $or: [{ orderNumber: regex }],
      })
        .populate("customerId", "name email phone")
        .select("orderNumber total status createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Search vendor's food items
      FoodItem.find({
        restaurantId: restaurant._id,
        $or: [{ name: regex }, { description: regex }],
      })
        .select("name price images")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return {
      orders: orders.map((o) => ({ ...o, type: "order" })),
      foodItems: foodItems.map((f) => ({ ...f, type: "foodItem" })),
    };
  }
}

export const dashboardSearchService = new DashboardSearchService();
