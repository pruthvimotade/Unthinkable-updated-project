import { Router } from "express";
import { authenticate } from "../modules/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const agentRouter = Router();

agentRouter.post(
  "/ping",
  authenticate,
  asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body as { latitude?: number; longitude?: number };
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: "Latitude and longitude are required" });
      return;
    }

    await prisma.agentStatus.update({
      where: { userId: req.user!.id },
      data: {
        latitude,
        longitude,
        lastSeenAt: new Date(),
      },
    });

    res.status(200).json({ success: true, message: "Ping recorded successfully" });
  })
);

agentRouter.get(
  "/notifications",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.status(200).json({ success: true, data: notifications });
  })
);

