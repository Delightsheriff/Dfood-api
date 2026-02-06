import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User";
import { env } from "../config/env";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../types/errors";
import {
  SignupInput,
  SigninInput,
  ForgotPasswordInput,
  VerifyOTPInput,
  ResetPasswordInput,
  UserRole,
  VendorStatus,
  VendorSignupInput,
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

  private sanitizeUser(user: IUser) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.role === UserRole.VENDOR && {
        vendorStatus: user.vendorStatus,
        businessName: user.businessName,
      }),
    };
  }

  async signup(data: SignupInput): Promise<{ user: any; token: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const user = await User.create({
      ...data,
      role: UserRole.CUSTOMER,
    });

    const token = this.generateToken(user._id.toString());

    return { user: this.sanitizeUser(user), token };
  }

  async signin(data: SigninInput): Promise<{ user: any; token: string }> {
    const user = await User.findOne({ email: data.email }).select("+password");

    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check vendor status
    if (
      user.role === UserRole.VENDOR &&
      user.vendorStatus === VendorStatus.SUSPENDED
    ) {
      throw new ForbiddenError("Your vendor account has been suspended");
    }

    if (
      user.role === UserRole.VENDOR &&
      user.vendorStatus === VendorStatus.REJECTED
    ) {
      throw new ForbiddenError("Your vendor application was rejected");
    }

    const token = this.generateToken(user._id.toString());

    return { user: this.sanitizeUser(user), token };
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

  async createAdmin(
    data: SignupInput,
    creatorId: string,
  ): Promise<{ user: any }> {
    // Verify creator is admin
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== UserRole.ADMIN) {
      throw new ForbiddenError("Only admins can create admin accounts");
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const user = await User.create({
      ...data,
      role: UserRole.ADMIN,
    });

    return { user: this.sanitizeUser(user) };
  }

  async vendorSignup(
    data: VendorSignupInput,
  ): Promise<{ user: any; token: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: UserRole.VENDOR,
      vendorStatus: VendorStatus.PENDING,
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
    });

    const token = this.generateToken(user._id.toString());

    // TODO: Send verification email
    // TODO: Notify admins of new vendor application

    return { user: this.sanitizeUser(user), token };
  }
}
