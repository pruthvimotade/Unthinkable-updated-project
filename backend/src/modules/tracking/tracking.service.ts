import type { OrderStatus, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../config/logger.config";
import { ApiError } from "../../utils/ApiError";
import { notificationService } from "../notification";
import { trackingRepository } from "./tracking.repository";
import {
  STATUS_TRANSITIONS,
  type TrackingTimeline,
  type TrackingEventRow,
  type UpdateStatusInput,
} from "./tracking.types";

/** Caller identity for ownership checks. */
export interface TrackingCaller {
  id: string;
  role: UserRole;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const trackingService = {
  /**
   * GET timeline — returns the complete immutable tracking history for an order.
   * Enforces ownership:
   *   - CUSTOMER may only fetch timelines for their own orders.
   *   - AGENT may only fetch timelines for orders assigned to them.
   *   - ADMIN may fetch any order's timeline.
   */
  async getTimeline(orderId: string, caller: TrackingCaller): Promise<TrackingTimeline> {
    const order = await trackingRepository.findOrderWithOwnership(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (caller.role === "CUSTOMER" && order.customerId !== caller.id) {
      throw ApiError.forbidden("You do not have permission to view this order");
    }

    if (caller.role === "AGENT") {
      const isAssigned = order.assignments.some((a) => a.agentId === caller.id);
      if (!isAssigned) {
        throw ApiError.forbidden("You do not have permission to view this order");
      }
    }

    const events = await trackingRepository.findTimeline(orderId);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      events,
    };
  },

  /**
   * PATCH status — validates the transition, then atomically:
   *   1. Inserts a new TrackingEvent row (immutable)
   *   2. Updates the Order's current status
   */
  async updateStatus(
    orderId: string,
    input: UpdateStatusInput,
    caller?: TrackingCaller,
  ): Promise<TrackingEventRow> {
    // ── 1. Fetch current order status ───────────────────────────────────
    const order = await trackingRepository.findOrderStatus(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    const currentStatus: OrderStatus = order.status;
    const nextStatus: OrderStatus = input.status;

    // ── 2. Validate transition ──────────────────────────────────────────
    const allowedNext = STATUS_TRANSITIONS[currentStatus];

    if (!allowedNext || !allowedNext.has(nextStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition: ${currentStatus} → ${nextStatus}. ` +
          `Allowed transitions from ${currentStatus}: ${
            allowedNext && allowedNext.size > 0
              ? [...allowedNext].join(", ")
              : "none (terminal state)"
          }`,
      );
    }

    // Lookup caller details & GPS coordinates
    let actorName = "System";
    let actorRole = "SYSTEM";
    let lat = input.latitude;
    let lng = input.longitude;

    if (caller) {
      actorRole = caller.role;
      const user = await prisma.user.findUnique({
        where: { id: caller.id },
        select: { name: true },
      });
      if (user) {
        actorName = user.name;
      }

      if (caller.role === "AGENT") {
        const agentStatus = await prisma.agentStatus.findUnique({
          where: { userId: caller.id },
          select: { latitude: true, longitude: true },
        });
        if (agentStatus && agentStatus.latitude !== null && agentStatus.longitude !== null) {
          lat = lat ?? Number(agentStatus.latitude);
          lng = lng ?? Number(agentStatus.longitude);
        }
      }
    }

    const enrichedMetadata = {
      ...(input.metadata as Record<string, any> || {}),
      actor: actorName,
      role: actorRole,
      timestamp: new Date().toISOString(),
      remarks: input.description ?? "",
    };

    // ── 3. Persist (transactional) ──────────────────────────────────────
    const event = await trackingRepository.createEventAndUpdateOrder({
      orderId,
      status: nextStatus,
      description: input.description,
      latitude: lat,
      longitude: lng,
      metadata: enrichedMetadata as Prisma.InputJsonValue,
    });

    logger.info(
      {
        orderId,
        orderNumber: order.orderNumber,
        from: currentStatus,
        to: nextStatus,
        eventId: event.id,
      },
      "Status Changed",
    );

    if (nextStatus === "DELIVERED") {
      logger.info(
        {
          orderId,
          orderNumber: order.orderNumber,
        },
        "Delivery Completed",
      );
    }

    const NOTIFY_ON = [
      "PICKUP_ASSIGNED",
      "ARRIVED_AT_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "FAILED",
      "CANCELLED",
      "RETURNED",
      "RESCHEDULED",
    ];
    if (NOTIFY_ON.includes(nextStatus)) {
      void notificationService.sendStatusUpdate(orderId);
    }

    return event;
  },
};
