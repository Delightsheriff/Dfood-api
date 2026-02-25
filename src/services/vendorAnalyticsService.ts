import Order from "../models/Order";
import Restaurant from "../models/Restaurant";
import { NotFoundError } from "../types/errors";

export class VendorAnalyticsService {
  /**
   * Get comprehensive analytics for vendor dashboard
   */
  async getAnalytics(vendorId: string, startDate: Date, endDate: Date) {
    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const [
      revenueTrend,
      orderTrend,
      statusBreakdown,
      popularItems,
      currentPeriodStats,
      previousPeriodStats,
    ] = await Promise.all([
      this.getRevenueTrend(restaurant._id, startDate, endDate),
      this.getOrderTrend(restaurant._id, startDate, endDate),
      this.getStatusBreakdown(restaurant._id, startDate, endDate),
      this.getPopularItems(restaurant._id, startDate, endDate),
      this.getPeriodStats(restaurant._id, startDate, endDate),
      this.getPeriodStats(restaurant._id, prevStartDate, prevEndDate),
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

    return {
      summary: {
        totalRevenue: currentPeriodStats.revenue,
        totalOrders: currentPeriodStats.orderCount,
        averageOrderValue: currentPeriodStats.averageOrderValue,
        revenueChange,
        ordersChange,
      },
      revenueTrend,
      orderTrend,
      statusBreakdown,
      popularItems,
    };
  }

  /**
   * Get daily revenue breakdown
   */
  private async getRevenueTrend(
    restaurantId: any,
    startDate: Date,
    endDate: Date,
  ) {
    const trend = await Order.aggregate([
      {
        $match: {
          restaurantId,
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
   * Get daily order count breakdown
   */
  private async getOrderTrend(
    restaurantId: any,
    startDate: Date,
    endDate: Date,
  ) {
    const trend = await Order.aggregate([
      {
        $match: {
          restaurantId,
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
   * Get order status breakdown
   */
  private async getStatusBreakdown(
    restaurantId: any,
    startDate: Date,
    endDate: Date,
  ) {
    const breakdown = await Order.aggregate([
      {
        $match: {
          restaurantId,
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
   * Get popular food items
   */
  private async getPopularItems(
    restaurantId: any,
    startDate: Date,
    endDate: Date,
  ) {
    const items = await Order.aggregate([
      {
        $match: {
          restaurantId,
          status: "delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.foodItemId",
          name: { $first: "$items.name" },
          totalOrders: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);

    return items.map((item) => ({
      foodItemId: item._id,
      name: item.name,
      orders: item.totalOrders,
      revenue: item.revenue,
    }));
  }

  /**
   * Get period statistics
   */
  private async getPeriodStats(
    restaurantId: any,
    startDate: Date,
    endDate: Date,
  ) {
    const stats = await Order.aggregate([
      {
        $match: {
          restaurantId,
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
    ]);

    return stats[0] || { revenue: 0, orderCount: 0, averageOrderValue: 0 };
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

export const vendorAnalyticsService = new VendorAnalyticsService();
