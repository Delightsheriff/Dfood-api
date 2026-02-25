import Order from "../models/Order";
import { NotFoundError } from "../types/errors";

export class AdminOrderService {
  /**
   * Get all orders across platform
   */
  async getAllOrders(filters?: {
    status?: string;
    restaurantId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.restaurantId) {
      query.restaurantId = filters.restaurantId;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name address")
      .sort({ createdAt: -1 })
      .lean();

    return orders;
  }

  /**
   * Get single order detail (admin can see any order)
   */
  async getOrderById(orderId: string) {
    const order = await Order.findById(orderId)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name address images")
      .lean();

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  }

  /**
   * Get platform-wide order statistics
   */
  async getOrderStats() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      statusBreakdown,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      topRestaurants,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ createdAt: { $gte: weekStart } }),
      Order.countDocuments({ createdAt: { $gte: monthStart } }),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered", createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered", createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: "$restaurantId",
            orderCount: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "restaurants",
            localField: "_id",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        { $unwind: "$restaurant" },
        {
          $project: {
            restaurantId: "$_id",
            restaurantName: "$restaurant.name",
            orderCount: 1,
            revenue: 1,
          },
        },
      ]),
    ]);

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        thisWeek: weekRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
      },
      statusBreakdown: statusBreakdown.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      topRestaurants,
    };
  }
}

export const adminOrderService = new AdminOrderService();
