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

const authService = new AuthService();

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);
  const { user, token } = await authService.signup(data);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  });
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const data = signinSchema.parse(req.body);
  const { user, token } = await authService.signin(data);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    },
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
  const user = (req as any).user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
});
