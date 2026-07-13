import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { Decimal } from "@prisma/client/runtime/library";
import { ApiError } from "../../utils/ApiError";
import { haversineKm } from "../../utils/geo.utils";
import type { AgentCandidate, AssignmentResult, OrderForAssignment } from "./assignment.types";

// ─── Select sets ────────────────────────────────────────────────────────────

const assignmentResultSelect = {
  id: true,
  orderId: true,
  agentId: true,
  assignedById: true,
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
    },
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  },
} as const;

// ─── Repository ─────────────────────────────────────────────────────────────

export const assignmentRepository = {
  /**
   * Fetch an order with its pickup area, zone, and area coordinates for assignment.
   */
  async findOrderForAssignment(orderId: string): Promise<OrderForAssignment | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        pickupLatitude: true,
        pickupLongitude: true,
        pickupArea: {
          select: {
            id: true,
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Fetch ONLINE agents operating within the configured radius of the pickup point.
   * Agents without a current location cannot safely be considered for auto-assignment.
   */
  async findAvailableAgents(params: {
    pickupLatitude: number;
    pickupLongitude: number;
    radiusKm: number;
  }): Promise<AgentCandidate[]> {
    const agents = await prisma.agentStatus.findMany({
      where: {
        availability: "ONLINE",
        latitude: { not: null },
        longitude: { not: null },
        user: {
          role: "AGENT",
          status: "ACTIVE",
        },
      },
      select: {
        userId: true,
        availability: true,
        capacity: true,
        activeOrders: true,
        latitude: true,
        longitude: true,
        lastSeenAt: true,
        rating: true,
        acceptanceRate: true,
        vehicleType: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const mapped: AgentCandidate[] = agents.map((a) => ({
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
      phone: a.user.phone,
      availability: a.availability,
      capacity: a.capacity,
      activeOrders: a.activeOrders,
      latitude: a.latitude,
      longitude: a.longitude,
      lastSeenAt: a.lastSeenAt,
      rating: Number(a.rating),
      acceptanceRate: Number(a.acceptanceRate),
      vehicleType: a.vehicleType,
    }));

    return mapped.filter((agent) =>
      agent.latitude !== null &&
      agent.longitude !== null &&
      haversineKm(
        params.pickupLatitude,
        params.pickupLongitude,
        Number(agent.latitude as Decimal),
        Number(agent.longitude as Decimal),
      ) <= params.radiusKm,
    );
  },

  /**
   * Fetch a specific agent's status for manual assignment validation.
   */
  async findAgentStatus(agentId: string): Promise<AgentCandidate | null> {
    const agent = await prisma.agentStatus.findUnique({
      where: { userId: agentId },
      select: {
        userId: true,
        availability: true,
        capacity: true,
        activeOrders: true,
        latitude: true,
        longitude: true,
        lastSeenAt: true,
        rating: true,
        acceptanceRate: true,
        vehicleType: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!agent || agent.user.role !== "AGENT" || agent.user.status !== "ACTIVE") {
      return null;
    }

    return {
      userId: agent.userId,
      name: agent.user.name,
      email: agent.user.email,
      phone: agent.user.phone,
      availability: agent.availability,
      capacity: agent.capacity,
      activeOrders: agent.activeOrders,
      latitude: agent.latitude,
      longitude: agent.longitude,
      lastSeenAt: agent.lastSeenAt,
      rating: Number(agent.rating),
      acceptanceRate: Number(agent.acceptanceRate),
      vehicleType: agent.vehicleType,
    };
  },

  async acceptAssignment(assignmentId: string): Promise<AssignmentResult> {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId }
      });

      if (!assignment) {
        throw ApiError.notFound("Assignment not found");
      }

      if (assignment.status !== "PENDING") {
        throw ApiError.badRequest(`Assignment status is ${assignment.status} — must be PENDING`);
      }

      const agentUser = await tx.user.findUnique({
        where: { id: assignment.agentId },
        select: { name: true }
      });
      const agentName = agentUser?.name || "Agent";

      const updated = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
        select: assignmentResultSelect,
      });

      // Insert immutable tracking event for acceptance
      await tx.trackingEvent.create({
        data: {
          orderId: assignment.orderId,
          status: "ASSIGNED",
          description: `Agent ${agentName} accepted the assignment`,
          metadata: {
            actor: agentName,
            role: "AGENT",
            timestamp: new Date().toISOString(),
            remarks: "Assignment accepted"
          }
        }
      });

      return updated;
    });
  },

  /**
   * Create assignment, update order status, create tracking event, and
   * increment agent's active orders — all in a single transaction.
   *
   * CONCURRENCY GUARD: locks both the order and agent-status rows before
   * revalidating their mutable state. This serializes competing assignments and
   * prevents an agent from being assigned beyond capacity.
   */
  async createAssignment(params: {
    orderId: string;
    agentId: string;
    assignedById: string;
    score: number | null;
    reason: string;
  }): Promise<AssignmentResult> {
    return prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw<Array<{ status: string }>>(
        Prisma.sql`SELECT "status" FROM "orders" WHERE "id" = ${params.orderId}::uuid FOR UPDATE`,
      );
      const lockedOrder = lockedOrders[0];

      if (!lockedOrder || !["PENDING", "CONFIRMED"].includes(lockedOrder.status)) {
        throw ApiError.badRequest("Order is no longer available for assignment");
      }

      const lockedAgentStatuses = await tx.$queryRaw<
        Array<{ availability: string; capacity: number; activeOrders: number }>
      >(
        Prisma.sql`SELECT "availability", "capacity", "active_orders" AS "activeOrders" FROM "agent_statuses" WHERE "user_id" = ${params.agentId}::uuid FOR UPDATE`,
      );
      const lockedAgentStatus = lockedAgentStatuses[0];

      if (!lockedAgentStatus) {
        throw ApiError.notFound("Agent status not found");
      }
      if (lockedAgentStatus.availability !== "ONLINE") {
        throw ApiError.badRequest("Agent is no longer ONLINE");
      }
      if (lockedAgentStatus.activeOrders >= lockedAgentStatus.capacity) {
        throw ApiError.badRequest(
          `Agent is at full capacity (${lockedAgentStatus.activeOrders}/${lockedAgentStatus.capacity})`,
        );
      }

      const agentUser = await tx.user.findUnique({
        where: { id: params.agentId },
        select: { name: true }
      });
      const agentName = agentUser?.name || params.agentId;

      // Safe fallback for assignedById UUID constraints
      let assignedById = params.assignedById;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedById);
      if (!isUuid) {
        const admin = await tx.user.findFirst({ where: { role: "ADMIN" } });
        assignedById = admin?.id || "00000000-0000-0000-0000-000000000000";
      }

      // 1. Create the assignment in PENDING status
      const assignment = await tx.assignment.create({
        data: {
          orderId: params.orderId,
          agentId: params.agentId,
          assignedById,
          status: "PENDING",
          assignmentScore: params.score,
          assignmentReason: params.reason,
          respondByAt: new Date(Date.now() + 90 * 1000), // 90 second acceptance window
        },
        select: assignmentResultSelect,
      });

      // 2. Update order status to ASSIGNED
      await tx.order.update({
        where: { id: params.orderId },
        data: { status: "ASSIGNED" },
      });

      // 3. Create tracking event
      await tx.trackingEvent.create({
        data: {
          orderId: params.orderId,
          status: "ASSIGNED",
          description: `Order assigned to agent ${agentName}`,
        },
      });

      // 4. Increment agent's active orders (reserved capacity) and mark BUSY if full
      const newActiveOrders = lockedAgentStatus.activeOrders + 1;
      const newAvailability = newActiveOrders >= lockedAgentStatus.capacity ? "BUSY" : "ONLINE";
      await tx.agentStatus.update({
        where: { userId: params.agentId },
        data: {
          activeOrders: newActiveOrders,
          availability: newAvailability,
        },
      });

      return assignment;
    });
  },

  /**
   * Reassign an order to a new agent.
   */
  async createReassignment(params: {
    orderId: string;
    newAgentId: string;
    assignedById: string;
    reason: string;
    score: number | null;
    oldAssignmentStatus?: any;
  }): Promise<AssignmentResult> {
    return prisma.$transaction(async (tx) => {
      // Lock the order
      const lockedOrders = await tx.$queryRaw<Array<{ status: string }>>(
        Prisma.sql`SELECT "status" FROM "orders" WHERE "id" = ${params.orderId}::uuid FOR UPDATE`,
      );
      if (!lockedOrders[0]) {
        throw ApiError.notFound("Order not found");
      }

      // Find the current active assignment
      const currentAssignments = await tx.assignment.findMany({
        where: { orderId: params.orderId, status: { in: ["ACCEPTED", "PENDING"] } }
      });
      const currentAssignment = currentAssignments[0];

      if (!currentAssignment) {
        throw ApiError.badRequest("Order does not have an active assignment to reassign");
      }

      if (currentAssignment.agentId === params.newAgentId) {
        throw ApiError.badRequest("Cannot reassign to the same agent");
      }

      // Check new agent status
      const lockedAgentStatuses = await tx.$queryRaw<
        Array<{ availability: string; capacity: number; activeOrders: number }>
      >(
        Prisma.sql`SELECT "availability", "capacity", "active_orders" AS "activeOrders" FROM "agent_statuses" WHERE "user_id" = ${params.newAgentId}::uuid FOR UPDATE`,
      );
      const newAgentStatus = lockedAgentStatuses[0];

      if (!newAgentStatus) {
        throw ApiError.notFound("New agent status not found");
      }
      if (newAgentStatus.availability !== "ONLINE") {
        throw ApiError.badRequest("New agent is no longer ONLINE");
      }
      if (newAgentStatus.activeOrders >= newAgentStatus.capacity) {
        throw ApiError.badRequest(
          `New agent is at full capacity (${newAgentStatus.activeOrders}/${newAgentStatus.capacity})`,
        );
      }

      // 1. Mark old assignment status
      await tx.assignment.update({
        where: { id: currentAssignment.id },
        data: { status: params.oldAssignmentStatus || "REASSIGNED" }
      });

      // 2. Decrement old agent capacity and update availability
      const oldAgentStatus = await tx.agentStatus.findUnique({
        where: { userId: currentAssignment.agentId }
      });
      if (oldAgentStatus) {
        const updatedActiveOrders = Math.max(0, oldAgentStatus.activeOrders - 1);
        const newAvailability = (oldAgentStatus.availability === "BUSY" && updatedActiveOrders < oldAgentStatus.capacity)
          ? "ONLINE"
          : oldAgentStatus.availability;
        await tx.agentStatus.update({
          where: { userId: currentAssignment.agentId },
          data: {
            activeOrders: updatedActiveOrders,
            availability: newAvailability
          }
        });
      }

      const agentUser = await tx.user.findUnique({
        where: { id: params.newAgentId },
        select: { name: true }
      });
      const agentName = agentUser?.name || params.newAgentId;

      // Safe fallback for assignedById UUID constraints
      let assignedById = params.assignedById;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedById);
      if (!isUuid) {
        const admin = await tx.user.findFirst({ where: { role: "ADMIN" } });
        assignedById = admin?.id || "00000000-0000-0000-0000-000000000000";
      }

      // 3. Create new assignment (PENDING)
      const newAssignment = await tx.assignment.create({
        data: {
          orderId: params.orderId,
          agentId: params.newAgentId,
          assignedById,
          status: "PENDING",
          assignmentScore: params.score,
          assignmentReason: params.reason,
          respondByAt: new Date(Date.now() + 90 * 1000), // 90 second acceptance window
        },
        select: assignmentResultSelect,
      });

      // 4. Update order status to ASSIGNED
      await tx.order.update({
        where: { id: params.orderId },
        data: { status: "ASSIGNED" },
      });

      // 5. Create tracking event
      await tx.trackingEvent.create({
        data: {
          orderId: params.orderId,
          status: "ASSIGNED",
          description: `Order reassigned to agent ${agentName}. Reason: ${params.reason}`,
        },
      });

      // 6. Increment new agent capacity and update availability
      const updatedNewActiveOrders = newAgentStatus.activeOrders + 1;
      const newAgentAvailability = updatedNewActiveOrders >= newAgentStatus.capacity ? "BUSY" : "ONLINE";
      await tx.agentStatus.update({
        where: { userId: params.newAgentId },
        data: {
          activeOrders: updatedNewActiveOrders,
          availability: newAgentAvailability
        }
      });

      return newAssignment;
    });
  },
};
