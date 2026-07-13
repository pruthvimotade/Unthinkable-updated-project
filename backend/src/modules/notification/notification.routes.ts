import { Router, Request, Response } from "express";
import { authenticate } from "../auth/auth.middleware";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

export const notificationRouter = Router();

notificationRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id as string },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.status(200).json({ success: true, data: notifications });
  })
);

notificationRouter.put(
  "/:id/read",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    // Optional: add a check to make sure the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== (req.user!.id as string)) {
      res.status(403).json({ success: false, message: "Unauthorized or not found" });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { status: "READ", readAt: new Date() }
    });

    res.status(200).json({ success: true, message: "Notification marked as read" });
  })
);

notificationRouter.put(
  "/read-all",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id as string, status: { not: "READ" } },
      data: { status: "READ", readAt: new Date() }
    });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  })
);
