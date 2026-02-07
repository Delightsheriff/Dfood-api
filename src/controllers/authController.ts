import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  verifyOTPSchema,
  resetPasswordSchema,
} from "../types/auth";
import { UnauthorizedError } from "../types/errors";
import { env } from "../config/env";

const authService = new AuthService();

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);
  const { user, token } = await authService.signup(data);

  res.status(201).json({
    success: true,
    data: { user, token },
  });
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?._id) {
    throw new UnauthorizedError("Authentication required");
  }

  const data = signupSchema.parse(req.body);
  const { user } = await authService.createAdmin(data, req.user._id.toString());

  res.status(201).json({
    success: true,
    data: { user },
    message: "Admin account created successfully",
  });
});

export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Google authentication failed");
    }

    const { token } = await authService.googleAuth(req.user as any);

    const redirectUrl = `${env.CLIENT_URL}/auth/callback?token=${token}`;

    res.redirect(redirectUrl);
  },
);

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const data = signinSchema.parse(req.body);
  const { user, token } = await authService.signin(data);

  res.status(200).json({
    success: true,
    data: { user, token },
  });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const data = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(data);

    res.status(200).json({
      success: true,
      message: "If email exists, OTP has been sent",
    });
  },
);

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const data = verifyOTPSchema.parse(req.body);
  const { resetToken } = await authService.verifyOTP(data);

  res.status(200).json({
    success: true,
    data: { resetToken },
    message: "OTP verified successfully",
  });
});

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Reset token required");
    }

    const resetToken = authHeader.split(" ")[1];
    const userId = await authService.validateResetToken(resetToken);

    const data = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(userId, data);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  },
);

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});
