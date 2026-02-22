import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { notificationService } from "../services/notificationService";

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const { unreadOnly, limit } = req.query;

    const notifications = await notificationService.getUserNotifications(
      req.user!._id.toString(),
      {
        unreadOnly: unreadOnly === "true",
        limit: limit ? parseInt(limit as string) : 50,
      },
    );

    res.status(200).json({
      success: true,
      data: { notifications },
    });
  },
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { count },
    });
  },
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(
    req.params.id as string,
    req.user!._id.toString(),
  );

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!._id.toString());

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  },
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    await notificationService.delete(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  },
);
