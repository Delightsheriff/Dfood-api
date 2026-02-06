import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const signinSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const verifyOTPSchema = z.object({
  email: z.email(),
  otp: z.string().length(4),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
