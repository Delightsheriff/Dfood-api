import Order, { IOrder } from "../models/Order";
import Restaurant from "../models/Restaurant";
import FoodItem from "../models/FoodItem";
import User from "../models/User";
import { addressService } from "./addressService";
import { paymentMethodService } from "./paymentMethodService";
import { paystackService } from "./paystackService";
import { CreateOrderInput } from "../types/order";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../types/errors";
import { checkIsOpen } from "../utils/timeUtils";
import crypto from "crypto";
import { notificationService } from "./notificationService";

export class OrderService {
  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Create new order
   */
  async create(userId: string, data: CreateOrderInput): Promise<IOrder> {
    // 1. Validate restaurant exists and is open
    const restaurant = await Restaurant.findById(data.restaurantId);
    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    if (!checkIsOpen(restaurant.openingTime, restaurant.closingTime)) {
      throw new ValidationError("Restaurant is currently closed");
    }

    // 2. Fetch and validate food items
    const foodItemIds = data.items.map((item) => item.foodItemId);
    const foodItems = await FoodItem.find({
      _id: { $in: foodItemIds },
      restaurantId: data.restaurantId,
    });

    if (foodItems.length !== data.items.length) {
      throw new ValidationError(
        "One or more items are not available from this restaurant",
      );
    }

    // 3. Calculate server-side prices and build order items
    let subtotal = 0;
    const orderItems = data.items.map((orderItem) => {
      const foodItem = foodItems.find(
        (f) => f._id.toString() === orderItem.foodItemId,
      );
      if (!foodItem) {
        throw new ValidationError("One or more items are no longer available");
      }

      const itemSubtotal = foodItem.price * orderItem.quantity;
      subtotal += itemSubtotal;

      return {
        foodItemId: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: orderItem.quantity,
        image: foodItem.images[0] || "",
        subtotal: itemSubtotal,
      };
    });

    const total = subtotal + restaurant.deliveryFee;

    // 4. Validate and get delivery address
    const address = await addressService.getById(data.addressId, userId);

    // 5. Get user for email (needed for Paystack)
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 6. Handle payment
    let paymentStatus: "pending" | "paid" | "failed" = "pending";
    let paymentMethod: "cash" | "card" = "cash";
    let paystackReference: string | undefined;

    if (data.paymentMethodId === "cash") {
      paymentMethod = "cash";
      paymentStatus = "pending"; // Pay on delivery
    } else {
      // Card payment
      const paymentMethodData = await paymentMethodService.getById(
        data.paymentMethodId,
        userId,
      );

      if (!paymentMethodData || !paymentMethodData.authorizationCode) {
        throw new ValidationError("Invalid payment method");
      }

      paymentMethod = "card";

      try {
        // Charge card via Paystack (amount in kobo)
        const chargeResult = await paystackService.chargeAuthorization(
          paymentMethodData.authorizationCode,
          user.email,
          total * 100, // Convert to kobo
        );

        paystackReference = chargeResult.reference;
        paymentStatus = "paid";
      } catch (error: any) {
        throw new ValidationError(`Payment failed: ${error.message}`);
      }
    }

    // 7. Create order
    const order = await Order.create({
      orderNumber: this.generateOrderNumber(),
      customerId: userId,
      restaurantId: data.restaurantId,
      items: orderItems,
      deliveryAddress: {
        street: address.street,
        city: address.city,
        state: address.state,
        coordinates: address.coordinates,
      },
      paymentMethod,
      paymentStatus,
      paystackReference,
      subtotal,
      deliveryFee: restaurant.deliveryFee,
      total,
      status: "pending",
      customerNotes: data.customerNotes,
    });

    // CREATE NOTIFICATION FOR VENDOR
    await notificationService.notifyVendorNewOrder(
      restaurant.ownerId.toString(),
      order.orderNumber,
      order._id.toString(),
    );

    // Populate restaurant for response - DON'T use toJSON which triggers virtuals
    const populatedOrder = await Order.findById(order._id)
      .populate("restaurantId", "name images address phone")
      .lean(); // Use lean to avoid virtual computation issues

    return populatedOrder as IOrder;
  }

  /**
   * Get order by ID or order number
   */
  async getById(orderId: string, userId: string): Promise<IOrder> {
    // Auto-detect: if it's a valid ObjectId use findById, otherwise query by orderNumber
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = isObjectId
      ? await Order.findById(orderId).populate(
          "restaurantId",
          "name images address phone",
        )
      : await Order.findOne({ orderNumber: orderId }).populate(
          "restaurantId",
          "name images address phone",
        );

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Users can only view their own orders
    if (order.customerId.toString() !== userId) {
      throw new ForbiddenError("You can only view your own orders");
    }

    return order;
  }

  /**
   * Get all orders for a customer
   */
  async getMyOrders(userId: string): Promise<IOrder[]> {
    const orders = await Order.find({ customerId: userId })
      .populate("restaurantId", "name images")
      .sort({ createdAt: -1 });

    return orders;
  }

  /**
   * Cancel order (only if pending)
   */
  async cancel(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenError("You can only cancel your own orders");
    }

    if (order.status !== "pending") {
      throw new ValidationError(
        "Cannot cancel order. Order has already been confirmed.",
      );
    }

    // If payment was card, initiate refund
    if (
      order.paymentMethod === "card" &&
      order.paymentStatus === "paid" &&
      order.paystackReference
    ) {
      // TODO: Implement Paystack refund
      // For now, just mark as refunded
      order.paymentStatus = "refunded";
    }

    order.status = "cancelled";
    await order.save();

    // NOTIFY VENDOR ABOUT CANCELLATION
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      await notificationService.notifyVendorOrderCancelled(
        restaurant.ownerId.toString(),
        order.orderNumber,
        order._id.toString(),
      );
    }

    return order;
  }

  /**
   * Get order by order number (for customer support)
   */
  async getByOrderNumber(orderNumber: string, userId: string): Promise<IOrder> {
    const order = await Order.findOne({ orderNumber }).populate(
      "restaurantId",
      "name images address phone",
    );

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenError("You can only view your own orders");
    }

    return order;
  }
}

export const orderService = new OrderService();
