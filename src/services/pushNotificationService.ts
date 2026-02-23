import admin from "firebase-admin";
import User from "../models/User";

export class PushNotificationService {
  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const user = await User.findById(userId).select("deviceTokens");

      if (!user || user.deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return;
      }

      const tokens = user.deviceTokens.map((dt) => dt.token);

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ Sent ${response.successCount} notifications to user ${userId}`,
      );

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          user.deviceTokens = user.deviceTokens.filter(
            (dt) => !invalidTokens.includes(dt.token),
          );
          await user.save();
          console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens`);
        }
      }
    } catch (error) {
      console.error("Push notification error:", error);
      // Don't throw - notification failure shouldn't break the app
    }
  }

  /**
   * Helper: Send order status update notification
   */
  async sendOrderStatusUpdate(
    userId: string,
    orderNumber: string,
    status: string,
  ) {
    const messages: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: "Order Confirmed! 🎉",
        body: `Your order ${orderNumber} has been confirmed`,
      },
      preparing: {
        title: "Food is Being Prepared 👨‍🍳",
        body: `Your order ${orderNumber} is being prepared`,
      },
      out_for_delivery: {
        title: "Order On The Way! 🚴",
        body: `Your order ${orderNumber} is out for delivery`,
      },
      delivered: {
        title: "Order Delivered! ⭐",
        body: `Your order ${orderNumber} has been delivered. Rate your experience!`,
      },
    };

    const message = messages[status];
    if (!message) return;

    await this.sendToUser(userId, message.title, message.body, {
      orderNumber,
      status,
      type: "order_update",
    });
  }
}

export const pushNotificationService = new PushNotificationService();
