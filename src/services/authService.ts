import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User";
import { env } from "../config/env";
import { ConflictError, UnauthorizedError } from "../types/errors";
import {
  SignupInput,
  SigninInput,
  ForgotPasswordInput,
  VerifyOTPInput,
  ResetPasswordInput,
} from "../types/auth";

export class AuthService {
  private generateToken(
    userId: string,
    expiresIn: string = env.JWT_EXPIRE,
  ): string {
    return jwt.sign({ userId }, env.JWT_SECRET!, {
      expiresIn: expiresIn as any,
    });
  }

  private generateResetToken(userId: string): string {
    return jwt.sign({ userId, purpose: "password-reset" }, env.JWT_SECRET!, {
      expiresIn: "5m",
    });
  }

  private generateOTP(): string {
    return crypto.randomInt(1000, 9999).toString();
  }

  async signup(data: SignupInput): Promise<{ user: IUser; token: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const user = await User.create(data);
    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  async signin(data: SigninInput): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.generateToken(user._id.toString());

    return { user, token };
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const user = await User.findOne({ email: data.email }).select(
      "+resetOTP +resetOTPExpire",
    );

    if (!user) {
      // Security: don't reveal if email exists
      return;
    }

    const otp = this.generateOTP();
    user.resetOTP = await bcrypt.hash(otp, 10);
    user.resetOTPExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // TODO: Send OTP via email service
    console.log(`[DEV] OTP for ${data.email}: ${otp}`);
  }

  async verifyOTP(data: VerifyOTPInput): Promise<{ resetToken: string }> {
    const user = await User.findOne({
      email: data.email,
      resetOTPExpire: { $gt: new Date() },
    }).select("+resetOTP");

    if (!user || !user.resetOTP) {
      throw new UnauthorizedError("Invalid or expired OTP");
    }

    const isOTPValid = await bcrypt.compare(data.otp, user.resetOTP);
    if (!isOTPValid) {
      throw new UnauthorizedError("Invalid or expired OTP");
    }

    // Generate short-lived reset token (proof of OTP verification)
    const resetToken = this.generateResetToken(user._id.toString());

    return { resetToken };
  }

  async resetPassword(userId: string, data: ResetPasswordInput): Promise<void> {
    const user = await User.findById(userId).select(
      "+resetOTP +resetOTPExpire",
    );

    if (!user) {
      throw new UnauthorizedError("Invalid reset session");
    }

    // Clear OTP data
    user.password = data.newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      return user;
    } catch (error) {
      throw new UnauthorizedError("Invalid token");
    }
  }

  async validateResetToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        purpose?: string;
      };

      if (decoded.purpose !== "password-reset") {
        throw new UnauthorizedError("Invalid reset token");
      }

      return decoded.userId;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }
  }
}
