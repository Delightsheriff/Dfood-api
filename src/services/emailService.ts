import { Resend } from "resend";
import { env } from "../config/env";
import {
  welcomeEmailHtml,
  otpEmailHtml,
  passwordResetConfirmationHtml,
  vendorWelcomeEmailHtml,
} from "../utils/emailTemplates";

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    } else {
      console.warn(
        "[EmailService] RESEND_API_KEY not set — emails will not be sent.",
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) return;

    try {
      const { error } = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("[EmailService] Failed to send email:", error);
      }
    } catch (err) {
      // Never let email failure crash the app
      console.error("[EmailService] Unexpected error sending email:", err);
    }
  }

  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    await this.send(email, "Welcome to DFood! 🍔", welcomeEmailHtml(name));
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    await this.send(email, "Your DFood Password Reset Code", otpEmailHtml(otp));
  }

  async sendPasswordResetConfirmation(
    email: string,
    name: string,
  ): Promise<void> {
    await this.send(
      email,
      "Your DFood Password Has Been Reset ✅",
      passwordResetConfirmationHtml(name),
    );
  }

  async sendVendorWelcomeEmail(
    name: string,
    email: string,
    restaurantName: string,
  ): Promise<void> {
    await this.send(
      email,
      `Welcome to DFood, ${restaurantName}! 🚀`,
      vendorWelcomeEmailHtml(name, restaurantName),
    );
  }
}

export const emailService = new EmailService();
