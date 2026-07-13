import type { OrderStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import type { JsonValue } from "@prisma/client/runtime/library";

// ─── Status Transition Map ─────────────────────────────────────────────────

/**
 * Defines valid status transitions.
 * Key = current status, Value = set of allowed next statuses.
 */
export const STATUS_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  PENDING:          new Set<OrderStatus>(["CONFIRMED", "ASSIGNED", "CANCELLED"]),
  CONFIRMED:        new Set<OrderStatus>(["ASSIGNED", "CANCELLED"]),
  ASSIGNED:         new Set<OrderStatus>(["PICKUP_ASSIGNED", "ARRIVED_AT_PICKUP", "PICKED_UP", "CANCELLED"]),
  PICKUP_ASSIGNED:  new Set<OrderStatus>(["ARRIVED_AT_PICKUP", "PICKED_UP", "FAILED", "CANCELLED"]),
  ARRIVED_AT_PICKUP: new Set<OrderStatus>(["PICKED_UP", "FAILED", "CANCELLED"]),
  PICKED_UP:        new Set<OrderStatus>(["IN_TRANSIT", "FAILED", "CANCELLED"]),
  IN_TRANSIT:       new Set<OrderStatus>(["OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED", "RETURNED"]),
  OUT_FOR_DELIVERY: new Set<OrderStatus>(["DELIVERED", "FAILED", "CANCELLED", "RETURNED"]),
  // Terminal states — no further transitions
  DELIVERED:        new Set<OrderStatus>(),
  CANCELLED:        new Set<OrderStatus>(),
  RETURNED:         new Set<OrderStatus>(),
  FAILED:           new Set<OrderStatus>(["RESCHEDULED", "PENDING", "RETURNED", "CANCELLED"]),
  RESCHEDULED:      new Set<OrderStatus>(["PENDING", "ASSIGNED", "CANCELLED"]),
};

// ─── Repository Types ───────────────────────────────────────────────────────

export interface TrackingEventRow {
  id: string;
  orderId: string;
  status: OrderStatus;
  description: string | null;
  latitude: Decimal | null;
  longitude: Decimal | null;
  metadata: JsonValue | null;
  createdAt: Date;
}

export interface OrderStatusInfo {
  id: string;
  orderNumber: string;
  status: OrderStatus;
}

/** Used by the service to enforce CUSTOMER/AGENT access control. */
export interface OrderWithOwnership {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerId: string;
  assignments: { agentId: string }[];
}

// ─── Service Input ──────────────────────────────────────────────────────────

export interface UpdateStatusInput {
  status: OrderStatus;
  description?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}

// ─── Service Output ─────────────────────────────────────────────────────────

export interface TrackingTimeline {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  events: TrackingEventRow[];
}
