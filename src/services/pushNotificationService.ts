import User from "../models/User";

// const EXPO_PUSH_URL = "https://exp.host/api/v2/push/send";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export class PushNotificationService {
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select("deviceTokens");

      if (!user || user.deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
        return;
      }

      // Filter to Expo tokens only (they start with "ExponentPushToken[")
      // const expoTokens = user.deviceTokens
      //   .map((dt) => dt.token)
      //   .filter((t) => t.startsWith("ExponentPushToken["));
      const expoTokens = user.deviceTokens
        .map((dt) => dt.token)
        .filter((token) => /^Expo(nent)?PushToken\[.*\]$/.test(token));

      if (expoTokens.length === 0) {
        console.log(`No Expo push tokens for user ${userId}`);
        return;
      }

      const messages: ExpoPushMessage[] = expoTokens.map((token) => ({
        to: token,
        title,
        body,
        data: data || {},
        sound: "default",
        priority: "high",
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`Expo push API returned ${response.status}`);
      }

      const result = (await response.json()) as { data: ExpoPushTicket[] };
      const tickets: ExpoPushTicket[] = result.data;

      // Prune invalid tokens
      const invalidTokens: string[] = [];
      tickets.forEach((ticket, idx) => {
        if (ticket.status === "error") {
          console.warn(
            `❌ Token failed: ${expoTokens[idx]} — ${ticket.message}`,
          );
          // DeviceNotRegistered means the token is dead
          if (ticket.details?.error === "DeviceNotRegistered") {
            invalidTokens.push(expoTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        user.deviceTokens = user.deviceTokens.filter(
          (dt) => !invalidTokens.includes(dt.token),
        );
        await user.save({ validateModifiedOnly: true });
        console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens`);
      }

      console.log(
        `✅ Sent ${tickets.filter((t) => t.status === "ok").length} notifications`,
      );
    } catch (error) {
      console.error("Push notification error:", error);
      // Don't throw — notification failure shouldn't break the app
    }
  }

  async sendOrderStatusUpdate(
    userId: string,
    orderNumber: string,
    status: string,
  ): Promise<void> {
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
