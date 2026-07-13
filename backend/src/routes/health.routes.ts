import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const healthRouter = Router();

/**
 * Liveness probe — process is up and responding.
 */
healthRouter.get("/live", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/**
 * Readiness probe — process is up AND its dependencies (DB) are reachable.
 * Used by orchestrators (k8s, ECS, etc.) to decide whether to route traffic.
 */
healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok" });
  })
);
