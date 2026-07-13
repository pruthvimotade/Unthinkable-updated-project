import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { OrderCreateData, OrderSummary } from "./order.types";

// ─── Select sets ────────────────────────────────────────────────────────────

const orderDetailSelect = {
  id: true,
  orderNumber: true,
  customerId: true,
  pickupAreaId: true,
  dropAreaId: true,
  pickupAddress: true,
  pickupAddressLine2: true,
  pickupContact: true,
  pickupLatitude: true,
  pickupLongitude: true,
  pickupPlaceId: true,
  dropAddress: true,
  dropAddressLine2: true,
  dropContact: true,
  dropLatitude: true,
  dropLongitude: true,
  dropPlaceId: true,
  lengthCm: true,
  widthCm: true,
  heightCm: true,
  actualWeight: true,
  volumetricWeight: true,
  billableWeight: true,
  orderType: true,
  paymentType: true,
  calculatedPrice: true,
  status: true,
  description: true,
  specialInstructions: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  pickupArea: {
    select: {
      id: true,
      name: true,
      code: true,
      pincode: true,
      zone: { select: { id: true, name: true, code: true } },
    },
  },
  dropArea: {
    select: {
      id: true,
      name: true,
      code: true,
      pincode: true,
      zone: { select: { id: true, name: true, code: true } },
    },
  },
  assignments: {
    select: {
      id: true,
      status: true,
      assignmentScore: true,
      assignmentReason: true,
      assignedAt: true,
      respondedAt: true,
      completedAt: true,
      agent: {
        select: { 
          id: true, 
          name: true, 
          email: true, 
          phone: true,
          agentStatus: {
            select: {
              rating: true,
              vehicleType: true,
              availability: true,
            }
          }
        },
      },
      assignedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { assignedAt: "desc" as const },
  },
  trackingEvents: {
    select: {
      id: true,
      status: true,
      description: true,
      latitude: true,
      longitude: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

const orderSummarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  orderType: true,
  paymentType: true,
  calculatedPrice: true,
  actualWeight: true,
  billableWeight: true,
  createdAt: true,
  updatedAt: true,
  pickupAddress: true,
  dropAddress: true,
  distanceKm: true,
  customer: {
    select: { id: true, name: true, phone: true },
  },
  assignments: {
    select: {
      id: true,
      status: true,
      assignmentScore: true,
      assignmentReason: true,
      assignedAt: true,
      agent: {
        select: { 
          id: true, 
          name: true, 
          email: true, 
          phone: true,
          agentStatus: {
            select: {
              rating: true,
              vehicleType: true,
              availability: true,
            }
          }
        },
      },
    },
    orderBy: { assignedAt: "desc" as const },
  },
} as const;

// ─── Repository ─────────────────────────────────────────────────────────────

export const orderRepository = {
  /**
   * Create an order and its initial tracking event in a single transaction.
   */
  async createWithTracking(data: OrderCreateData) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          pickupAreaId: data.pickupAreaId ?? null,
          dropAreaId: data.dropAreaId ?? null,
          distanceKm: data.distanceKm ?? null,
          estimatedDuration: data.estimatedDuration ?? null,
          pickupAddress: data.pickupAddress,
          pickupAddressLine2: data.pickupAddressLine2 ?? null,
          pickupContact: data.pickupContact,
          pickupLatitude: data.pickupLatitude,
          pickupLongitude: data.pickupLongitude,
          pickupPlaceId: data.pickupPlaceId,
          dropAddress: data.dropAddress,
          dropAddressLine2: data.dropAddressLine2 ?? null,
          dropContact: data.dropContact,
          dropLatitude: data.dropLatitude,
          dropLongitude: data.dropLongitude,
          dropPlaceId: data.dropPlaceId,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          heightCm: data.heightCm,
          actualWeight: data.actualWeight,
          volumetricWeight: data.volumetricWeight,
          billableWeight: data.billableWeight,
          orderType: data.orderType,
          paymentType: data.paymentType,
          calculatedPrice: data.calculatedPrice,
          status: "PENDING",
          description: data.description ?? null,
          specialInstructions: data.specialInstructions ?? null,
        },
        select: orderDetailSelect,
      });

      await tx.trackingEvent.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          description: "Order created",
        },
      });

      // Re-fetch to include the tracking event in the response
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: orderDetailSelect,
      });
    });
  },

  /**
   * Find a single order with full details (customer, areas, assignments, tracking).
   */
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      select: orderDetailSelect,
    });
  },

  /**
   * List orders with pagination and access-controlled filters.
   * - customerId: restrict to one customer (CUSTOMER role)
   * - agentId:   restrict to orders with an assignment for that agent (AGENT role)
   * - No filter:  return everything (ADMIN role)
   */
  async findMany(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    customerId?: string;
    agentId?: string;
    zoneId?: string;
    orderType?: string;
    paymentType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ orders: OrderSummary[]; total: number }> {
    const where: Prisma.OrderWhereInput = {};
    const andConditions: Prisma.OrderWhereInput[] = [];

    if (params.status) {
      andConditions.push({ status: params.status });
    }
    if (params.customerId) {
      andConditions.push({ customerId: params.customerId });
    }
    if (params.agentId) {
      andConditions.push({ 
        assignments: { 
          some: { 
            agentId: params.agentId,
            status: { in: ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"] }
          } 
        } 
      });
    }
    if (params.zoneId) {
      andConditions.push({
        OR: [
          { pickupArea: { zoneId: params.zoneId } },
          { dropArea: { zoneId: params.zoneId } },
        ]
      });
    }
    if (params.orderType) {
      andConditions.push({ orderType: params.orderType as any });
    }
    if (params.paymentType) {
      andConditions.push({ paymentType: params.paymentType as any });
    }
    if (params.dateFrom || params.dateTo) {
      const dateCond: Prisma.DateTimeFilter = {};
      if (params.dateFrom) dateCond.gte = new Date(params.dateFrom);
      if (params.dateTo) dateCond.lte = new Date(params.dateTo);
      andConditions.push({ createdAt: dateCond });
    }
    if (params.search) {
      andConditions.push({
        OR: [
          { orderNumber: { contains: params.search, mode: "insensitive" } },
          { customer: { name: { contains: params.search, mode: "insensitive" } } },
          { customer: { phone: { contains: params.search } } },
          { pickupContact: { contains: params.search } },
          { dropContact: { contains: params.search } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: "desc" };
    if (params.sortBy) {
      if (params.sortBy === "calculatedPrice") {
        orderBy = { calculatedPrice: params.sortOrder || "desc" };
      } else if (params.sortBy === "createdAt") {
        orderBy = { createdAt: params.sortOrder || "desc" };
      }
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        select: orderSummarySelect,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  },

  /**
   * Transactionally records a reschedule, updates order status, and logs a tracking event.
   */
  async createRescheduleTransaction(orderId: string, requestedDate: Date) {
    return prisma.$transaction(async (tx) => {
      // 1. Insert Reschedule record
      const reschedule = await tx.reschedule.create({
        data: {
          orderId,
          requestedDate,
        },
      });

      // 2. Update Order status
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "RESCHEDULED" },
      });

      // 3. Insert Tracking Event
      await tx.trackingEvent.create({
        data: {
          orderId,
          status: "RESCHEDULED",
          description: `Delivery rescheduled for ${requestedDate.toLocaleDateString()}`,
          metadata: { requestedDate: requestedDate.toISOString() },
        },
      });

      return { reschedule, order };
    });
  },
};
