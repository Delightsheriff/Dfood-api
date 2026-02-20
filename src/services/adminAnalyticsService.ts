import Order from "../models/Order";
import User from "../models/User";
import Restaurant from "../models/Restaurant";
import { UserRole } from "../types/auth";

export class AdminAnalyticsService {
  /**
   * Get comprehensive platform analytics
   */
  async getAnalytics(startDate: Date, endDate: Date) {
    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const [
      revenueTrend,
      orderTrend,
      userGrowth,
      restaurantPerformance,
      topRestaurants,
      categoryPerformance,
      statusBreakdown,
      currentPeriodStats,
      previousPeriodStats,
    ] = await Promise.all([
      this.getRevenueTrend(startDate, endDate),
      this.getOrderTrend(startDate, endDate),
      this.getUserGrowth(startDate, endDate),
      this.getRestaurantPerformance(startDate, endDate),
      this.getTopRestaurants(startDate, endDate),
      this.getCategoryPerformance(startDate, endDate),
      this.getStatusBreakdown(startDate, endDate),
      this.getPeriodStats(startDate, endDate),
      this.getPeriodStats(prevStartDate, prevEndDate),
    ]);

    // Calculate percentage changes
    const revenueChange = this.calculatePercentageChange(
      previousPeriodStats.revenue,
      currentPeriodStats.revenue,
    );
    const ordersChange = this.calculatePercentageChange(
      previousPeriodStats.orderCount,
      currentPeriodStats.orderCount,
    );
    const usersChange = this.calculatePercentageChange(
      previousPeriodStats.newUsers,
      currentPeriodStats.newUsers,
    );

    return {
      summary: {
        totalRevenue: currentPeriodStats.revenue,
        totalOrders: currentPeriodStats.orderCount,
        totalUsers: currentPeriodStats.totalUsers,
        newUsers: currentPeriodStats.newUsers,
        activeRestaurants: currentPeriodStats.activeRestaurants,
        averageOrderValue: currentPeriodStats.averageOrderValue,
        revenueChange,
        ordersChange,
        usersChange,
      },
      revenueTrend,
      orderTrend,
      userGrowth,
      restaurantPerformance,
      topRestaurants,
      categoryPerformance,
      statusBreakdown,
    };
  }

  /**
   * Get platform-wide revenue trend
   */
  private async getRevenueTrend(startDate: Date, endDate: Date) {
    const trend = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trend.map((item) => ({
      date: item._id,
      revenue: item.revenue,
    }));
  }

  /**
   * Get platform-wide order trend
   */
  private async getOrderTrend(startDate: Date, endDate: Date) {
    const trend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trend.map((item) => ({
      date: item._id,
      orders: item.count,
    }));
  }

  /**
   * Get user growth trend
   */
  private async getUserGrowth(startDate: Date, endDate: Date) {
    const growth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          customers: {
            $sum: { $cond: [{ $eq: ["$role", UserRole.CUSTOMER] }, 1, 0] },
          },
          vendors: {
            $sum: { $cond: [{ $eq: ["$role", UserRole.VENDOR] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return growth.map((item) => ({
      date: item._id,
      customers: item.customers,
      vendors: item.vendors,
      total: item.total,
    }));
  }

  /**
   * Get restaurant performance breakdown
   */
  private async getRestaurantPerformance(startDate: Date, endDate: Date) {
    const performance = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$restaurantId",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
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
          averageOrderValue: { $divide: ["$revenue", "$orderCount"] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return performance;
  }

  /**
   * Get top performing restaurants
   */
  private async getTopRestaurants(startDate: Date, endDate: Date) {
    const top = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$restaurantId",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
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
    ]);

    return top;
  }

  /**
   * Get category performance
   */
  private async getCategoryPerformance(startDate: Date, endDate: Date) {
    const performance = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "fooditems",
          localField: "items.foodItemId",
          foreignField: "_id",
          as: "foodItem",
        },
      },
      { $unwind: "$foodItem" },
      { $unwind: "$foodItem.categoryIds" },
      {
        $group: {
          _id: "$foodItem.categoryIds",
          orderCount: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          categoryId: "$_id",
          categoryName: "$category.name",
          orderCount: 1,
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return performance;
  }

  /**
   * Get order status breakdown
   */
  private async getStatusBreakdown(startDate: Date, endDate: Date) {
    const breakdown = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return breakdown.map((item) => ({
      status: item._id,
      count: item.count,
    }));
  }

  /**
   * Get period statistics
   */
  private async getPeriodStats(startDate: Date, endDate: Date) {
    const [orderStats, userStats, restaurantStats] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$total" },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: "$total" },
          },
        },
      ]),
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            newUsers: [
              {
                $match: {
                  createdAt: { $gte: startDate, $lte: endDate },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]),
      Restaurant.aggregate([
        {
          $lookup: {
            from: "orders",
            let: { restaurantId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$restaurantId", "$$restaurantId"] },
                  createdAt: { $gte: startDate, $lte: endDate },
                },
              },
            ],
            as: "orders",
          },
        },
        {
          $match: {
            "orders.0": { $exists: true },
          },
        },
        { $count: "count" },
      ]),
    ]);

    return {
      revenue: orderStats[0]?.revenue || 0,
      orderCount: orderStats[0]?.orderCount || 0,
      averageOrderValue: orderStats[0]?.averageOrderValue || 0,
      totalUsers: userStats[0]?.total[0]?.count || 0,
      newUsers: userStats[0]?.newUsers[0]?.count || 0,
      activeRestaurants: restaurantStats[0]?.count || 0,
    };
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(
    oldValue: number,
    newValue: number,
  ): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
