import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors";
import { ZodError } from "zod";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Log unexpected errors
  console.error("Unexpected error:", err);

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
};
