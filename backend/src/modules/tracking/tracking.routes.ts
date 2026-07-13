import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../auth";
import { getTimeline, updateStatus } from "./tracking.controller";
import { orderIdParamSchema, updateStatusSchema } from "./tracking.validation";

export const trackingRouter = Router();

// All tracking routes require authentication
trackingRouter.use(authenticate);

// GET /api/v1/tracking/:orderId — any authenticated user
trackingRouter.get(
  "/:orderId",
  validate(orderIdParamSchema, "params"),
  asyncHandler(getTimeline),
);

// PATCH /api/v1/tracking/:orderId/status — AGENT or ADMIN only
trackingRouter.patch(
  "/:orderId/status",
  authorize("AGENT", "ADMIN"),
  validate(orderIdParamSchema, "params"),
  validate(updateStatusSchema),
  asyncHandler(updateStatus),
);
