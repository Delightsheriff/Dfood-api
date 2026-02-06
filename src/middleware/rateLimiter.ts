import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../types/errors";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _next) => {
    throw new TooManyRequestsError("Too many login attempts");
  },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts",
  skipSuccessfulRequests: true,
  handler: (_req, _res, _next) => {
    throw new TooManyRequestsError("Too many password reset attempts");
  },
});
