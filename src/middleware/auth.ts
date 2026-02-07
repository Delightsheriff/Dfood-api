import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { UnauthorizedError, ForbiddenError } from "../types/errors";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRole } from "../types/auth";
import { IUser } from "../models/User";

const authService = new AuthService();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const user = await authService.validateToken(token);

    req.user = user;
    next();
  },
);

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action",
      );
    }

    next();
  };
};
