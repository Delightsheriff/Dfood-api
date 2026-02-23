import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/User";
import { z } from "zod";

const registerTokenSchema = z.object({
  token: z.string().min(1, "Device token required"),
  platform: z.enum(["ios", "android"]),
});

export const registerDeviceToken = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token, platform } = registerTokenSchema.parse(req.body);

    const user = await User.findById(req.user!._id);
    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "User not found" });
      return;
    }

    // Check if token already exists
    const tokenExists = user.deviceTokens.some((dt) => dt.token === token);

    if (!tokenExists) {
      user.deviceTokens.push({ token, platform, addedAt: new Date() });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Device token registered successfully",
    });
  },
);

export const unregisterDeviceToken = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    const user = await User.findById(req.user!._id);
    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "User not found" });
      return;
    }

    user.deviceTokens = user.deviceTokens.filter((dt) => dt.token !== token);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Device token unregistered successfully",
    });
  },
);
