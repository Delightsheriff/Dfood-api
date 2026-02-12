import PaymentMethod, { IPaymentMethod } from "../models/PaymentMethod";
import User from "../models/User";
import { paystackService } from "./paystackService";
import { AddCardInput } from "../types/payment";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../types/errors";

export class PaymentMethodService {
  /**
   * Add card payment method by verifying Paystack transaction
   */
  async addCard(userId: string, data: AddCardInput): Promise<IPaymentMethod> {
    // Verify transaction with Paystack
    const transaction = await paystackService.verifyTransaction(data.reference);

    // Ensure transaction was successful
    if (transaction.status !== "success") {
      throw new ValidationError("Transaction was not successful");
    }

    // Ensure transaction has authorization (reusable token)
    if (
      !transaction.authorization ||
      !transaction.authorization.authorization_code
    ) {
      throw new ValidationError("Card authorization failed. Please try again.");
    }

    const auth = transaction.authorization;

    // Check if card already exists (by last4 + exp)
    const existing = await PaymentMethod.findOne({
      userId,
      type: "card",
      cardLast4: auth.last4,
      cardExpMonth: auth.exp_month,
      cardExpYear: auth.exp_year,
    });

    if (existing) {
      throw new ValidationError("This card has already been added");
    }

    // Check if this is the first payment method
    const count = await PaymentMethod.countDocuments({ userId });
    const isDefault = count === 0;

    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      userId,
      type: "card",
      authorizationCode: auth.authorization_code,
      cardLast4: auth.last4,
      cardBrand: auth.brand,
      cardExpMonth: auth.exp_month,
      cardExpYear: auth.exp_year,
      bank: auth.bank,
      isDefault,
    });

    return paymentMethod;
  }

  /**
   * Get all payment methods for user (cash + cards)
   */
  async getAll(userId: string): Promise<any[]> {
    const cards = await PaymentMethod.find({ userId, type: "card" })
      .select("-authorizationCode") // Don't expose authorization code
      .sort({ isDefault: -1, createdAt: -1 });

    // Cash is always available, add it to the list
    const cashOption = {
      _id: "cash",
      type: "cash",
      isDefault: cards.length === 0, // Default if no cards exist
    };

    return [cashOption, ...cards];
  }

  /**
   * Get payment method by ID (for order processing)
   */
  async getById(id: string, userId: string): Promise<IPaymentMethod | null> {
    // Handle cash option
    if (id === "cash") {
      return null; // Cash doesn't need DB record
    }

    const paymentMethod =
      await PaymentMethod.findById(id).select("+authorizationCode");

    if (!paymentMethod) {
      throw new NotFoundError("Payment method not found");
    }

    if (paymentMethod.userId.toString() !== userId) {
      throw new ForbiddenError("You can only access your own payment methods");
    }

    return paymentMethod;
  }

  /**
   * Set default payment method
   */
  async setDefault(id: string, userId: string): Promise<IPaymentMethod> {
    // Cannot set cash as default (it's auto-default when no cards exist)
    if (id === "cash") {
      throw new ValidationError("Cannot set cash as default explicitly");
    }

    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      throw new NotFoundError("Payment method not found");
    }

    if (paymentMethod.userId.toString() !== userId) {
      throw new ForbiddenError("You can only update your own payment methods");
    }

    // Unset all other payment methods as default
    await PaymentMethod.updateMany(
      { userId, _id: { $ne: id } },
      { isDefault: false },
    );

    paymentMethod.isDefault = true;
    await paymentMethod.save();

    return paymentMethod;
  }

  /**
   * Delete payment method
   */
  async delete(id: string, userId: string): Promise<void> {
    // Cannot delete cash option
    if (id === "cash") {
      throw new ValidationError("Cannot delete cash payment option");
    }

    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      throw new NotFoundError("Payment method not found");
    }

    if (paymentMethod.userId.toString() !== userId) {
      throw new ForbiddenError("You can only delete your own payment methods");
    }

    const wasDefault = paymentMethod.isDefault;
    await paymentMethod.deleteOne();

    // If deleted payment was default, set another card as default
    if (wasDefault) {
      const nextCard = await PaymentMethod.findOne({
        userId,
        type: "card",
      }).sort({ createdAt: -1 });

      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }
  }

  /**
   * Get default payment method
   */
  async getDefault(userId: string): Promise<any> {
    const defaultCard = await PaymentMethod.findOne({
      userId,
      isDefault: true,
    }).select("-authorizationCode");

    // If no default card, return cash
    if (!defaultCard) {
      return {
        _id: "cash",
        type: "cash",
        isDefault: true,
      };
    }

    return defaultCard;
  }
}

export const paymentMethodService = new PaymentMethodService();
