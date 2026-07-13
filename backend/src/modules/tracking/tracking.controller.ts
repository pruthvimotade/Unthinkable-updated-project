import type { Request, Response } from "express";
import { trackingService } from "./tracking.service";
import type { OrderIdParam, UpdateStatusInput } from "./tracking.validation";

/**
 * GET /api/v1/tracking/:orderId
 *
 * Return the complete immutable tracking timeline for an order.
 * Access-controlled: CUSTOMER sees only their own, AGENT only assigned, ADMIN all.
 */
export async function getTimeline(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const caller = req.user!;
  const timeline = await trackingService.getTimeline(orderId, caller);

  res.status(200).json({
    success: true,
    data: timeline,
  });
}

/**
 * PATCH /api/v1/tracking/:orderId/status
 *
 * Update order status with transition validation.
 * Only AGENT or ADMIN roles allowed.
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const input = req.body as UpdateStatusInput;
  const caller = req.user!;

  const event = await trackingService.updateStatus(orderId, input, caller);

  res.status(200).json({
    success: true,
    message: "Status updated successfully",
    data: event,
  });
}
