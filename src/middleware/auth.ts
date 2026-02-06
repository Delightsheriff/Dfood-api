import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { UnauthorizedError } from "../types/errors";
import { asyncHandler } from "../utils/asyncHandler";

const authService = new AuthService();

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const user = await authService.validateToken(token);

    (req as any).user = user;
    next();
  },
);
