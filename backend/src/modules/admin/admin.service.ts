import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { notificationService } from "../notification/notification.service";
import * as validation from "./admin.validation";
import type { OrderStatus, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { calculateZoneSaturations } from "../../utils/zone.utils";

export const adminService = {
  // Zones
  async getZones() {
    return prisma.zone.findMany({ orderBy: { name: 'asc' } });
  },
  async createZone(data: z.infer<typeof validation.createZoneSchema>) {
    return prisma.zone.create({ data });
  },
  async updateZone(id: string, data: z.infer<typeof validation.updateZoneSchema>) {
    return prisma.zone.update({ where: { id }, data });
  },

  // Areas
  async getAreas(zoneId?: string) {
    return prisma.area.findMany({
      where: zoneId ? { zoneId } : undefined,
      include: { zone: true },
      orderBy: { name: 'asc' },
    });
  },
  async createArea(data: z.infer<typeof validation.createAreaSchema>) {
    return prisma.area.create({ data });
  },
  async updateArea(id: string, data: z.infer<typeof validation.updateAreaSchema>) {
    return prisma.area.update({ where: { id }, data });
  },

  // Rate Cards
  async getRateCards() {
    return prisma.rateCard.findMany({ orderBy: { createdAt: 'desc' } });
  },
  async createRateCard(data: z.infer<typeof validation.createRateCardSchema>) {
    return prisma.rateCard.create({ data });
  },
  async updateRateCard(id: string, data: z.infer<typeof validation.updateRateCardSchema>) {
    return prisma.rateCard.update({ where: { id }, data });
  },

  // Agents
  async getAgents() {
    return prisma.user.findMany({
      where: { role: 'AGENT' },
      include: { 
        agentStatus: true,
        _count: {
          select: { agentAssignments: true }
        }
      },
    });
  },
  async updateAgentStatus(id: string, status: z.infer<typeof validation.updateAgentStatusSchema>["status"]) {
    return prisma.user.update({
      where: { id },
      data: { status },
    });
  },

  // Users (Staff & Customers)
  async getUsers(params: z.infer<typeof validation.getUsersQuerySchema>) {
    const where: { role?: UserRole; status?: UserStatus } = {};
    if (params.role) where.role = params.role as UserRole;
    if (params.status) where.status = params.status as UserStatus;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },
  
  async createStaff(data: z.infer<typeof validation.createUserSchema>) {
    // We import authService dynamically to avoid circular dependencies if any, 
    // or just import it at the top. Let's assume we import it.
    const { authService } = await import("../auth/auth.service");
    return authService.createUser({
      ...data,
      isVerified: true,
      isPhoneVerified: true
    });
  },

  // Analytics
  async getAnalytics(dateRange: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todaysOrders,
      deliveredOrders,
      pendingOrders,
      assignedOrders,
      outForDelivery,
      failedDeliveries,
      activeAgents,
      availableAgents,
      totalAgents,
      totalCustomers,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'ASSIGNED' } }),
      prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.agentStatus.count({ where: { availability: { not: 'OFFLINE' } } }),
      prisma.agentStatus.count({ where: { availability: 'ONLINE' } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({
        _sum: { calculatedPrice: true },
        where: { status: { notIn: ['FAILED', 'CANCELLED'] } },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        assignments: {
          include: { agent: true }
        },
        trackingEvents: true
      }
    });

    const recentAssignments = await prisma.assignment.findMany({
      take: 5,
      orderBy: { assignedAt: 'desc' },
      include: { order: true, agent: true }
    });

    const recentTracking = await prisma.trackingEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { order: true }
    });

    // Zone Saturation calculation using shared utility
    const zoneSaturations = await calculateZoneSaturations();

    return {
      stats: {
        revenue: revenueResult._sum.calculatedPrice ? Number(revenueResult._sum.calculatedPrice) : 0,
        totalOrders,
        todaysOrders,
        deliveredOrders,
        delivered: deliveredOrders,
        pendingOrders,
        assignedOrders,
        outForDelivery,
        failedDeliveries,
        activeAgents,
        availableAgents,
        totalAgents,
        totalCustomers,
        dateRange,
        zoneSaturations,
      },
      recentOrders,
      recentAssignments,
      recentTracking,
    };
  },

  // Order Override
  async overrideTracking(orderId: string, toStatus: OrderStatus, reason: string, adminId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Create override log
      await tx.statusOverrideLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus,
          reason,
          overriddenById: adminId,
        }
      });

      // Update Order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: toStatus },
      });

      // Create tracking event
      await tx.trackingEvent.create({
        data: {
          orderId,
          status: toStatus,
          description: `Status overridden by Admin: ${reason}`,
        }
      });

      // Fix agent capacity leak on terminal states during admin override
      const terminalStates = ["DELIVERED", "FAILED", "CANCELLED", "RETURNED"];
      if (terminalStates.includes(toStatus)) {
        const assignment = await tx.assignment.findFirst({
          where: { orderId, status: { in: ["ACCEPTED", "PENDING"] } },
        });

        if (assignment) {
          const newAssignmentStatus = toStatus === "DELIVERED" ? "COMPLETED" : "CANCELLED";
          await tx.assignment.update({
            where: { id: assignment.id },
            data: { status: newAssignmentStatus, completedAt: new Date() }
          });

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

      return updated;
    });

    void notificationService.sendStatusUpdate(orderId);

    return updatedOrder;
  }
};
