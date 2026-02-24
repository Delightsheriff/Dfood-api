import Notification, { NotificationType } from "../models/Notification";
import User from "../models/User";
import { UserRole } from "../types/auth";

export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  async create(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ) {
    // Set expiration to 90 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      data,
      read: false,
      expiresAt,
    });

    return notification;
  }

  /**
   * Create notification for all admins
   */
  async createForAllAdmins(
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ) {
    const admins = await User.find({ role: UserRole.ADMIN }).select("_id");

    const notifications = await Promise.all(
      admins.map((admin) =>
        this.create(admin._id.toString(), type, title, message, data),
      ),
    );

    return notifications;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters?: { unreadOnly?: boolean; limit?: number },
  ) {
    const query: any = { recipientId: userId };

    if (filters?.unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .lean();

    return notifications;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({
      recipientId: userId,
      read: false,
    });

    return count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { read: true },
      { new: true },
    );

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true },
    );
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string) {
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId,
    });
  }

  /**
   * Helper: Create notification for new order
   */
  async notifyVendorNewOrder(
    vendorId: string,
    orderNumber: string,
    orderId: string,
  ) {
    return this.create(
      vendorId,
      "new_order",
      "New Order Received",
      `You have a new order: ${orderNumber}`,
      { orderId, orderNumber },
    );
  }

  /**
   * Helper: Create notification for order cancellation
   */
  async notifyVendorOrderCancelled(
    vendorId: string,
    orderNumber: string,
    orderId: string,
  ) {
    return this.create(
      vendorId,
      "order_cancelled",
      "Order Cancelled",
      `Order ${orderNumber} has been cancelled by the customer`,
      { orderId, orderNumber },
    );
  }

  /**
   * Helper: Create notification for new vendor signup
   */
  async notifyAdminsNewVendor(
    vendorName: string,
    vendorId: string,
    restaurantName: string,
  ) {
    return this.createForAllAdmins(
      "new_vendor_signup",
      "New Vendor Registered",
      `${vendorName} signed up with restaurant: ${restaurantName}`,
      { vendorId, restaurantName },
    );
  }

  /**
   * Helper: Create notification for customer order status update
   */
  async notifyCustomerOrderStatus(
    customerId: string,
    orderNumber: string,
    orderId: string,
    status: string,
  ) {
    const messages: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: "Order Confirmed! 🎉",
        message: `Your order ${orderNumber} has been confirmed`,
      },
      preparing: {
        title: "Food is Being Prepared 👨‍🍳",
        message: `Your order ${orderNumber} is being prepared`,
      },
      out_for_delivery: {
        title: "Order On The Way! 🚴",
        message: `Your order ${orderNumber} is out for delivery`,
      },
      delivered: {
        title: "Order Delivered! ⭐",
        message: `Your order ${orderNumber} has been delivered. Rate your experience!`,
      },
    };

    const msg = messages[status];
    if (!msg) return;

    return this.create(
      customerId,
      "order_status_update",
      msg.title,
      msg.message,
      { orderId, orderNumber, status },
    );
  }
}

export const notificationService = new NotificationService();
