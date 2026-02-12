import Paystack from "paystack-api";
import { env } from "../config/env";

const paystack = Paystack(env.PAYSTACK_SECRET_KEY);

export class PaystackService {
  /**
   * Verify transaction and get authorization code
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await paystack.transaction.verify(reference);

      if (!response.status) {
        throw new Error("Transaction verification failed");
      }

      return response.data;
    } catch (error: any) {
      console.error("Paystack verification error:", error);
      throw new Error(error.message || "Failed to verify transaction");
    }
  }

  /**
   * Charge authorization (for recurring payments)
   */
  async chargeAuthorization(
    authorizationCode: string,
    email: string,
    amount: number, // Amount in kobo (NGN smallest unit)
  ): Promise<any> {
    try {
      const response = await paystack.transaction.charge({
        authorization_code: authorizationCode,
        email,
        amount,
      });

      if (!response.status) {
        throw new Error("Payment failed");
      }

      return response.data;
    } catch (error: any) {
      console.error("Paystack charge error:", error);
      throw new Error(error.message || "Payment failed");
    }
  }

  /**
   * Initialize transaction (for new card payments)
   */
  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
  ): Promise<any> {
    try {
      const response = await paystack.transaction.initialize({
        email,
        amount,
        reference,
        channels: ["card"],
      });

      if (!response.status) {
        throw new Error("Failed to initialize transaction");
      }

      return response.data;
    } catch (error: any) {
      console.error("Paystack initialization error:", error);
      throw new Error(error.message || "Failed to initialize payment");
    }
  }
}

export const paystackService = new PaystackService();
