import type { OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { OrderStatusInfo, OrderWithOwnership, TrackingEventRow } from "./tracking.types";

// ─── Select sets ────────────────────────────────────────────────────────────

const trackingEventSelect = {
  id: true,
  orderId: true,
  status: true,
  description: true,
  latitude: true,
  longitude: true,
  metadata: true,
  createdAt: true,
} as const;

// ─── Repository ─────────────────────────────────────────────────────────────

export const trackingRepository = {
  /**
   * Fetch the order's current status (lightweight — no relations).
   */
  async findOrderStatus(orderId: string): Promise<OrderStatusInfo | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });
  },

  /**
   * Fetch the minimal order fields needed for ownership checks.
   * Returns customerId and assignments so the service can enforce RBAC.
   */
  async findOrderWithOwnership(orderId: string): Promise<OrderWithOwnership | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerId: true,
        assignments: {
          select: { agentId: true },
        },
      },
    });
  },

  /**
   * Fetch the full tracking timeline for an order, ordered chronologically (ASC).
   */
  async findTimeline(orderId: string): Promise<TrackingEventRow[]> {
    return prisma.trackingEvent.findMany({
      where: { orderId },
      select: trackingEventSelect,
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Insert a new tracking event and update the order status in a single transaction.
   * TrackingEvent rows are immutable — never updated, only appended.
   */
  async createEventAndUpdateOrder(params: {
    orderId: string;
    status: OrderStatus;
    description?: string;
    latitude?: number;
    longitude?: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<TrackingEventRow> {
    return prisma.$transaction(async (tx) => {
      // 1. Insert immutable tracking event
      const event = await tx.trackingEvent.create({
        data: {
          orderId: params.orderId,
          status: params.status,
          description: params.description ?? null,
          latitude: params.latitude ?? null,
          longitude: params.longitude ?? null,
          metadata: params.metadata ?? Prisma.JsonNull,
        },
        select: trackingEventSelect,
      });

      // 2. Update order's current status
      await tx.order.update({
        where: { id: params.orderId },
        data: { status: params.status },
      });

      // 3. Fix agent capacity leak on terminal states
      const terminalStates = ["DELIVERED", "FAILED", "CANCELLED", "RETURNED"];
      if (terminalStates.includes(params.status)) {
        // Find the active assignment
        const assignment = await tx.assignment.findFirst({
          where: { orderId: params.orderId, status: "ACCEPTED" },
        });

        if (assignment) {
          // Update assignment to COMPLETED or CANCELLED
          const newStatus = params.status === "DELIVERED" ? "COMPLETED" : "CANCELLED";
          await tx.assignment.update({
            where: { id: assignment.id },
            data: { status: newStatus, completedAt: new Date() }
          });

          // Safely decrement agent capacity
          const agentStatus = await tx.agentStatus.findUnique({
            where: { userId: assignment.agentId }
          });

          if (agentStatus && agentStatus.activeOrders > 0) {
            const updatedActiveOrders = agentStatus.activeOrders - 1;
            const newAvailability = (agentStatus.availability === "BUSY" && updatedActiveOrders < agentStatus.capacity) 
              ? "ONLINE" 
              : agentStatus.availability;

            await tx.agentStatus.update({
              where: { userId: assignment.agentId },
              data: {
                activeOrders: updatedActiveOrders,
                availability: newAvailability
              }
            });
          }
        }
      }

      return event;
    });
  },
};
