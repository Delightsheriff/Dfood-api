import axios from "axios";
import { env } from "../config/env";

const paystackAxios = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export class PaystackService {
  /**
   * Verify transaction and get authorization code
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await paystackAxios.get(
        `/transaction/verify/${reference}`,
      );

      if (!response.data.status) {
        throw new Error("Transaction verification failed");
      }

      return response.data.data;
    } catch (error: any) {
      console.error(
        "Paystack verification error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to verify transaction",
      );
    }
  }

  /**
   * Charge authorization (for recurring payments)
   */
  async chargeAuthorization(
    authorizationCode: string,
    email: string,
    amount: number,
  ): Promise<any> {
    try {
      const response = await paystackAxios.post(
        "/transaction/charge_authorization",
        {
          authorization_code: authorizationCode,
          email,
          amount,
        },
      );

      if (!response.data.status) {
        throw new Error(response.data.message || "Payment failed");
      }

      return response.data.data;
    } catch (error: any) {
      console.error(
        "Paystack charge error:",
        error.response?.data || error.message,
      );
      throw new Error(error.response?.data?.message || "Payment failed");
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
      const response = await paystackAxios.post("/transaction/initialize", {
        email,
        amount,
        reference,
        channels: ["card"],
      });

      if (!response.data.status) {
        throw new Error("Failed to initialize transaction");
      }

      return response.data.data;
    } catch (error: any) {
      console.error(
        "Paystack initialization error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Failed to initialize payment",
      );
    }
  }
}

export const paystackService = new PaystackService();
