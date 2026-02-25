import Order from "../models/Order";
import Restaurant from "../models/Restaurant";
import { NotFoundError, ValidationError } from "../types/errors";
import { pushNotificationService } from "./pushNotificationService";
import { notificationService } from "./notificationService";

export class VendorOrderService {
  /**
   * Get all orders for vendor's restaurant
   */
  async getRestaurantOrders(
    vendorId: string,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    // Build query
    const query: any = { restaurantId: restaurant._id };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return orders;
  }

  /**
   * Get single order detail (vendor can only see their restaurant's orders)
   */
  async getOrderById(vendorId: string, orderId: string) {
    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: restaurant._id,
    })
      .populate("customerId", "name email phone")
      .lean();

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    vendorId: string,
    orderId: string,
    newStatus: string,
  ) {
    // Get vendor's restaurant
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      restaurantId: restaurant._id,
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(newStatus)) {
      throw new ValidationError(
        `Cannot change status from ${order.status} to ${newStatus}`,
      );
    }

    // Update status
    order.status = newStatus as any;
    await order.save();

    // SEND PUSH NOTIFICATION TO CUSTOMER
    await pushNotificationService.sendOrderStatusUpdate(
      order.customerId.toString(),
      order.orderNumber,
      newStatus,
    );

    // CREATE IN-APP NOTIFICATION FOR CUSTOMER
    await notificationService.notifyCustomerOrderStatus(
      order.customerId.toString(),
      order.orderNumber,
      order._id.toString(),
      newStatus,
    );

    // Populate customer info for response
    await order.populate("customerId", "name email phone");

    return order;
  }

  /**
   * Get order statistics for vendor dashboard
   */
  async getOrderStats(vendorId: string) {
    const restaurant = await Restaurant.findOne({ ownerId: vendorId });
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

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
    ] = await Promise.all([
      Order.countDocuments({ restaurantId: restaurant._id }),
      Order.countDocuments({
        restaurantId: restaurant._id,
        createdAt: { $gte: todayStart },
      }),
      Order.countDocuments({
        restaurantId: restaurant._id,
        createdAt: { $gte: weekStart },
      }),
      Order.countDocuments({
        restaurantId: restaurant._id,
        createdAt: { $gte: monthStart },
      }),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurantId: restaurant._id, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            restaurantId: restaurant._id,
            status: "delivered",
            createdAt: { $gte: todayStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
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
      },
      statusBreakdown: statusBreakdown.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}

export const vendorOrderService = new VendorOrderService();
