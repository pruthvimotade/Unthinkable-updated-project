import { randomUUID } from "crypto";
import type { OrderType, PaymentType, UserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from "../../config/logger.config";
import { ApiError } from "../../utils/ApiError";
import { pricingService } from "../pricing";
import { notificationService } from "../notification";
import { orderRepository } from "./order.repository";
import type {
  CreateOrderInput,
  PaginatedOrders,
  QuoteResponse,
} from "./order.types";
import type { ListOrdersQuery, QuoteInput } from "./order.validation";

/** Caller identity injected from req.user by the controller. */
export interface OrderCaller {
  id: string;
  role: UserRole;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a human-readable order number.
 * Format: ORD-<YYYYMMDD>-<short-uuid>
 */
function generateOrderNumber(): string {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = randomUUID().slice(0, 8).toUpperCase();
  return `ORD-${yyyymmdd}-${shortId}`;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const orderService = {
  /**
   * Get a pricing quote without saving anything.
   * Delegates entirely to the Pricing Engine.
   */
  async quote(input: QuoteInput): Promise<QuoteResponse> {
    const pricing = await pricingService.calculate({
      pickupAreaId: input.pickupAreaId,
      pickupPincode: input.pickupPincode,
      dropAreaId: input.dropAreaId,
      dropPincode: input.dropPincode,
      pickupLatitude: input.pickupLatitude,
      pickupLongitude: input.pickupLongitude,
      dropLatitude: input.dropLatitude,
      dropLongitude: input.dropLongitude,
      length: input.length,
      width: input.width,
      height: input.height,
      actualWeight: input.actualWeight,
      orderType: input.orderType,
      paymentType: input.paymentType,
    });

    return { pricing };
  },

  /**
   * Create an order.
   * 1. Recalculate pricing server-side (never trust the client)
   * 2. Persist order + initial tracking event in a transaction
   */
  async create(input: CreateOrderInput, customerId: string) {
    // Resolve area by pincode if areaId not provided
    let pickupAreaId = input.pickupAreaId || null;
    let dropAreaId = input.dropAreaId || null;

    if (!pickupAreaId && input.pickupPincode) {
      const area = await pricingService.resolveAreaByPincode(input.pickupPincode);
      if (area) pickupAreaId = area.id;
    }
    if (!dropAreaId && input.dropPincode) {
      const area = await pricingService.resolveAreaByPincode(input.dropPincode);
      if (area) dropAreaId = area.id;
    }

    // ── 1. Server-side pricing ──────────────────────────────────────────
    const pricing = await pricingService.calculateForOrder({
      pickupAreaId: pickupAreaId || undefined,
      dropAreaId: dropAreaId || undefined,
      pickupPincode: input.pickupPincode,
      dropPincode: input.dropPincode,
      pickupLatitude: input.pickupLatitude,
      pickupLongitude: input.pickupLongitude,
      dropLatitude: input.dropLatitude,
      dropLongitude: input.dropLongitude,
      length: input.length,
      width: input.width,
      height: input.height,
      actualWeight: input.actualWeight,
      orderType: input.orderType,
      paymentType: input.paymentType,
    });

    // ── 2. Create order ─────────────────────────────────────────────────
    const orderNumber = generateOrderNumber();

    const order = await orderRepository.createWithTracking({
      orderNumber,
      customerId,
      pickupAreaId,
      dropAreaId,
      distanceKm: pricing.distanceKm,
      estimatedDuration: pricing.estimatedDuration,
      pickupAddress: input.pickupAddress,
      pickupAddressLine2: input.pickupAddressLine2,
      pickupContact: input.pickupContact,
      pickupLatitude: new Decimal(input.pickupLatitude),
      pickupLongitude: new Decimal(input.pickupLongitude),
      pickupPlaceId: input.pickupPlaceId,
      dropAddress: input.dropAddress,
      dropAddressLine2: input.dropAddressLine2,
      dropContact: input.dropContact,
      dropLatitude: new Decimal(input.dropLatitude),
      dropLongitude: new Decimal(input.dropLongitude),
      dropPlaceId: input.dropPlaceId,
      lengthCm: input.length,
      widthCm: input.width,
      heightCm: input.height,
      actualWeight: pricing.actualWeight,
      volumetricWeight: pricing.volumetricWeight,
      billableWeight: pricing.billableWeight,
      orderType: input.orderType as OrderType,
      paymentType: input.paymentType as PaymentType,
      calculatedPrice: pricing.finalPrice,
      description: input.description,
      specialInstructions: input.specialInstructions,
    });

    logger.info(
      { orderId: order.id, orderNumber, customerId, price: pricing.finalPrice.toString() },
      "Order Created",
    );

    // Fire-and-forget notification with error handling
    notificationService.sendOrderCreated(order.id).catch((err: any) => {
      logger.warn({ orderId: order.id, err: err.message }, "Notification failed during order creation");
    });

    // Fire-and-forget auto assignment
    import("../assignment/index.js").then(({ assignmentService }) => {
      assignmentService.autoAssign(order.id, "SYSTEM").catch((err: any) => {
        logger.warn({ orderId: order.id, err: err.message }, "Auto-assignment failed during order creation");
      });
    });

    return order;
  },

  /**
   * Get complete order details by ID.
   * Enforces ownership:
   *   - CUSTOMER may only fetch their own orders.
   *   - AGENT may only fetch orders assigned to them.
   *   - ADMIN may fetch any order.
   */
  async getById(orderId: string, caller: OrderCaller) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (caller.role === "CUSTOMER" && order.customerId !== caller.id) {
      throw ApiError.forbidden("You do not have permission to view this order");
    }

    if (caller.role === "AGENT") {
      const isAssigned = order.assignments.some((a) => a.agent.id === caller.id);
      if (!isAssigned) {
        throw ApiError.forbidden("You do not have permission to view this order");
      }
    }

    return order;
  },

  /**
   * List orders with pagination and filters.
   * Enforces ownership:
   *   - CUSTOMER sees only their own orders (ignores any client-supplied customerId).
   *   - AGENT sees only orders they are assigned to.
   *   - ADMIN sees all orders (may optionally filter by customerId query param).
   */
  async list(query: ListOrdersQuery, caller: OrderCaller): Promise<PaginatedOrders> {
    let customerId: string | undefined;
    let agentId: string | undefined;

    if (caller.role === "CUSTOMER") {
      customerId = caller.id; // Force-scope to their own orders
    } else if (caller.role === "AGENT") {
      agentId = caller.id;
    } else {
      // ADMIN — allow optional filters from query params
      customerId = query.customerId;
      agentId = query.agentId;
    }

    const { orders, total } = await orderRepository.findMany({
      page: query.page,
      limit: query.limit,
      status: query.status,
      customerId,
      agentId,
      zoneId: query.zoneId,
      orderType: query.orderType,
      paymentType: query.paymentType,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      orders,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  /**
   * Reschedule a failed order.
   * 1. Validate status is FAILED
   * 2. Insert Reschedule record & update status to PENDING
   * 3. Insert TrackingEvent
   * 4. Trigger auto-assignment
   * 5. Send notification
   */
  async rescheduleOrder(orderId: string, requestedDate: string, caller: OrderCaller) {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (caller.role === "CUSTOMER" && order.customerId !== caller.id) {
      throw ApiError.forbidden("You do not have permission to reschedule this order");
    }
    if (caller.role === "AGENT") {
      throw ApiError.forbidden("Agents cannot reschedule orders");
    }

    if (order.status !== "FAILED") {
      throw ApiError.badRequest(`Order cannot be rescheduled from status: ${order.status}`);
    }

    // Single transaction for Reschedule, Order status, and Tracking Event
    const result = await orderRepository.createRescheduleTransaction(
      orderId,
      new Date(requestedDate)
    );

    // Fire-and-forget: Notify customer of status update
    void notificationService.sendStatusUpdate(orderId);

    // Fire-and-forget auto assignment
    import("../assignment/index.js").then(({ assignmentService }) => {
      assignmentService.autoAssign(orderId, "SYSTEM").catch((err: any) => {
        logger.warn({ orderId, err: err.message }, "Auto-assignment failed during order reschedule");
      });
    });

    return result;
  },
};
