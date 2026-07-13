import { logger } from "../../config/logger.config";
import { env } from "../../config/env.config";
import { ApiError } from "../../utils/ApiError";
import { notificationService } from "../notification";
import { prisma } from "../../lib/prisma";
import { emailService } from "../../email/email.service";
import { assignmentRepository } from "./assignment.repository";
import { haversineKm } from "../../utils/geo.utils";
import { checkZoneSaturation as checkZoneSaturationUtil } from "../../utils/zone.utils";
import type {
  AgentCandidate,
  AssignmentResult,
  ScoredAgent,
} from "./assignment.types";

// ─── Scoring Constants ──────────────────────────────────────────────────────

const WEIGHTS = {
  DISTANCE: 0.40,
  ACTIVE_DELIVERIES: 0.25,
  RATING: 0.20,
  ACCEPTANCE_RATE: 0.10,
  VEHICLE_SUITABILITY: 0.05,
} as const;

async function findAvailableAgentsWithRadiusExpansion(params: {
  pickupLatitude: number;
  pickupLongitude: number;
  baseRadius: number;
}): Promise<{ agents: AgentCandidate[]; radiusUsed: number }> {
  let radius = params.baseRadius;
  let agents = await assignmentRepository.findAvailableAgents({
    pickupLatitude: params.pickupLatitude,
    pickupLongitude: params.pickupLongitude,
    radiusKm: radius,
  });

  if (agents.length > 0) {
    return { agents, radiusUsed: radius };
  }

  // Retry at 2x
  radius = params.baseRadius * 2;
  logger.info({ radius }, "No agents found at base radius, retrying at 2x radius");
  agents = await assignmentRepository.findAvailableAgents({
    pickupLatitude: params.pickupLatitude,
    pickupLongitude: params.pickupLongitude,
    radiusKm: radius,
  });

  if (agents.length > 0) {
    return { agents, radiusUsed: radius };
  }

  // Retry at 3x
  radius = params.baseRadius * 3;
  logger.info({ radius }, "No agents found at 2x radius, retrying at 3x radius");
  agents = await assignmentRepository.findAvailableAgents({
    pickupLatitude: params.pickupLatitude,
    pickupLongitude: params.pickupLongitude,
    radiusKm: radius,
  });

  return { agents, radiusUsed: radius };
}

// ─── Scoring Engine ─────────────────────────────────────────────────────────

function scoreAgent(
  agent: AgentCandidate,
  pickupLat: number,
  pickupLng: number,
  orderWeight = 0,
  orderVolume = 0,
): ScoredAgent {
  // ── Distance Score (0–100) ─────────────────────────────────────────────
  let distanceScore = 0;
  let dist = 999999;
  if (agent.latitude !== null && agent.longitude !== null) {
    dist = haversineKm(
      pickupLat,
      pickupLng,
      Number(agent.latitude),
      Number(agent.longitude),
    );
    distanceScore = Math.max(0, 100 - (dist / 15) * 100);
  }

  // ── Active Deliveries Score (0–100) ────────────────────────────────────
  const activeDeliveriesScore = Math.max(
    0,
    100 - (agent.activeOrders / agent.capacity) * 100,
  );

  // ── Rating Score (0–100) ───────────────────────────────────────────────
  const rating = agent.rating ?? 4.0;
  const ratingScore = (rating / 5) * 100;

  // ── Acceptance Rate Score (0–100) ──────────────────────────────────────
  const acceptanceRate = agent.acceptanceRate !== null && agent.acceptanceRate !== undefined ? Number(agent.acceptanceRate) : 0.85;
  const acceptanceRateScore = acceptanceRate > 1.0 ? acceptanceRate : acceptanceRate * 100;

  // ── Vehicle Suitability Score (0–100) ──────────────────────────────────
  let vehicleSuitabilityScore = 100;
  if (agent.vehicleType) {
    if (orderWeight > 100 || orderVolume > 1000000) {
      if (["WALKING", "BICYCLE"].includes(agent.vehicleType)) {
        vehicleSuitabilityScore = 0;
      } else if (agent.vehicleType === "SCOOTER") {
        vehicleSuitabilityScore = 30;
      }
    } else if (orderWeight > 20 || orderVolume > 200000) {
      if (["WALKING", "BICYCLE"].includes(agent.vehicleType)) {
        vehicleSuitabilityScore = 30;
      }
    }
  }

  // ── Weighted Total ─────────────────────────────────────────────────────
  let totalScore =
    distanceScore * WEIGHTS.DISTANCE +
    activeDeliveriesScore * WEIGHTS.ACTIVE_DELIVERIES +
    ratingScore * WEIGHTS.RATING +
    acceptanceRateScore * WEIGHTS.ACCEPTANCE_RATE +
    vehicleSuitabilityScore * WEIGHTS.VEHICLE_SUITABILITY;

  const isStale = agent.lastSeenAt !== null && (Date.now() - agent.lastSeenAt.getTime()) > 5 * 60 * 1000;
  if (isStale) {
    totalScore = Math.max(0, totalScore - 50); // 50 point staleness penalty
  }

  // Backward compatibility:
  const availabilityScore = agent.availability === "ONLINE" ? 100 : 0;
  const capacityScore = agent.capacity > 0 ? ((agent.capacity - agent.activeOrders) / agent.capacity) * 100 : 0;
  let idleTimeScore = 100;
  if (agent.lastSeenAt) {
    const idleMinutes = (Date.now() - agent.lastSeenAt.getTime()) / 60_000;
    idleTimeScore = Math.min(100, (idleMinutes / 120) * 100);
  }

  return {
    agent,
    distanceScore: +distanceScore.toFixed(2),
    availabilityScore: +availabilityScore.toFixed(2),
    capacityScore: +capacityScore.toFixed(2),
    idleTimeScore: +idleTimeScore.toFixed(2),
    activeDeliveriesScore: +activeDeliveriesScore.toFixed(2),
    ratingScore: +ratingScore.toFixed(2),
    acceptanceRateScore: +acceptanceRateScore.toFixed(2),
    vehicleSuitabilityScore: +vehicleSuitabilityScore.toFixed(2),
    totalScore: +totalScore.toFixed(2),
    distanceKm: +dist.toFixed(2),
    isStale,
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export const assignmentService = {
  /**
   * AUTO ASSIGNMENT
   */
  async autoAssign(orderId: string, assignedById: string): Promise<AssignmentResult> {
    // ── 1. Fetch and validate order ─────────────────────────────────────
    const order = await assignmentRepository.findOrderForAssignment(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      throw ApiError.badRequest(
        `Order cannot be assigned — current status is ${order.status}`,
      );
    }

    // ── 2. Resolve pickup coordinates ───────────────────────────────────
    let pickupZone = null;
    if (order.pickupArea) {
      pickupZone = order.pickupArea.zone;
    }

    if (order.pickupLatitude === null || order.pickupLongitude === null) {
      throw ApiError.badRequest("Order is missing pickup coordinates");
    }

    const pickupLat = Number(order.pickupLatitude);
    const pickupLng = Number(order.pickupLongitude);

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    const orderWeight = fullOrder ? Number(fullOrder.actualWeight) : 0;
    const orderVolume = fullOrder ? Number(fullOrder.lengthCm || 0) * Number(fullOrder.widthCm || 0) * Number(fullOrder.heightCm || 0) : 0;

    // ── 3. Fetch nearby available agents with radius expansion ──────────
    const { agents: availableAgents, radiusUsed } = await findAvailableAgentsWithRadiusExpansion({
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      baseRadius: env.AGENT_ASSIGNMENT_RADIUS_KM,
    });

    const pastAssignments = await prisma.assignment.findMany({
      where: { orderId },
      select: { agentId: true }
    });
    const excludedAgentIds = pastAssignments.map(a => a.agentId);

    // Check if agents exist but all are at capacity
    const eligibleCapacity = availableAgents.filter(a => a.availability === "ONLINE" && a.capacity > a.activeOrders);
    if (availableAgents.length > 0 && eligibleCapacity.length === 0) {
      let adminEmail = "admin@logistics.in";
      const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (adminUser?.email) adminEmail = adminUser.email;
      void emailService.sendAdminAlert(
        adminEmail,
        "No Agent Available",
        `All online agents in the area are at full capacity for order #${order.orderNumber}.`
      );
      throw ApiError.badRequest("All agents are at full capacity");
    }

    // ── 4. Filter agents with capacity, non-stale, and not excluded ─────
    const eligibleAgents = availableAgents.filter((a) => {
      const hasCapacity = a.availability === "ONLINE" && a.capacity > a.activeOrders;
      const isAgentStale = a.lastSeenAt !== null && (Date.now() - a.lastSeenAt.getTime()) > 5 * 60 * 1000;
      const isExcluded = excludedAgentIds.includes(a.userId);
      return hasCapacity && !isAgentStale && !isExcluded;
    });

    if (eligibleAgents.length === 0) {
      let adminEmail = "admin@logistics.in";
      const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (adminUser?.email) adminEmail = adminUser.email;
      
      void emailService.sendAdminAlert(
        adminEmail,
        "No Agent Available",
        `No online, non-stale agents found within expanded search (up to 3x radius) for order #${order.orderNumber}.`
      );
      throw ApiError.badRequest("No available agents found within expanded search");
    }

    // ── 5. Score eligible agents ───────────────────────────────────────
    const scoredAgents = eligibleAgents.map((agent) =>
      scoreAgent(agent, pickupLat, pickupLng, orderWeight, orderVolume),
    );

    // ── 6. Pick highest-scoring agent ─────────────────────────────────
    scoredAgents.sort((a, b) => b.totalScore - a.totalScore);
    const best = scoredAgents[0];

    logger.info(
      {
        orderId,
        recommendation: {
          agentId: best.agent.userId,
          score: best.totalScore,
          distance: best.distanceKm,
        },
        candidatesCount: scoredAgents.length,
      },
      "Recommendation Generated",
    );

    logger.info(
      {
        orderId,
        orderNumber: order.orderNumber,
        pickupZone: pickupZone?.code || 'DISTANCE_BASED',
        selectedAgent: best.agent.userId,
        score: best.totalScore,
        candidateCount: scoredAgents.length,
      },
      "Auto-assignment: agent selected",
    );

    // Trigger zone saturation check
    if (order.pickupArea) {
      void checkZoneSaturationUtil(order.pickupArea.zone.id, order.pickupArea.zone.name);
    }

    const reason =
      `Auto-assigned. Radius used: ${radiusUsed}km. Score: ${best.totalScore} ` +
      `(dist: ${best.distanceScore}, avail: ${best.availabilityScore}, ` +
      `cap: ${best.capacityScore}, idle: ${best.idleTimeScore}). ` +
      `Zone: ${pickupZone?.code || 'DISTANCE_BASED'}. Candidates: ${scoredAgents.length}.`;

    const assignment = await assignmentRepository.createAssignment({
      orderId,
      agentId: best.agent.userId,
      assignedById,
      score: best.totalScore,
      reason,
    });

    void notificationService.sendAgentAssigned(orderId);

    return assignment;
  },

  /**
   * MANUAL ASSIGNMENT
   */
  async manualAssign(
    orderId: string,
    agentId: string,
    assignedById: string,
  ): Promise<AssignmentResult> {
    const order = await assignmentRepository.findOrderForAssignment(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      throw ApiError.badRequest(
        `Order cannot be assigned — current status is ${order.status}`,
      );
    }

    const agent = await assignmentRepository.findAgentStatus(agentId);
    if (!agent) {
      throw ApiError.notFound("Agent not found or not active");
    }
    if (agent.availability !== "ONLINE") {
      throw ApiError.badRequest(
        `Agent is currently ${agent.availability} — must be ONLINE`,
      );
    }
    if (agent.activeOrders >= agent.capacity) {
      throw ApiError.badRequest(
        `Agent is at full capacity (${agent.activeOrders}/${agent.capacity})`,
      );
    }

    let assignmentScore: number | null = null;
    try {
      if (order.pickupLatitude && order.pickupLongitude) {
        const fullOrder = await prisma.order.findUnique({ where: { id: orderId } });
        const orderWeight = fullOrder ? Number(fullOrder.actualWeight) : 0;
        const orderVolume = fullOrder ? Number(fullOrder.lengthCm || 0) * Number(fullOrder.widthCm || 0) * Number(fullOrder.heightCm || 0) : 0;
        const scored = scoreAgent(agent, Number(order.pickupLatitude), Number(order.pickupLongitude), orderWeight, orderVolume);
        assignmentScore = scored.totalScore;
      }
    } catch (e) {
      logger.warn({ err: e }, "Failed to compute score for manual assignment");
    }

    logger.info(
      {
        orderId,
        orderNumber: order.orderNumber,
        agentId,
        assignedById,
        score: assignmentScore,
      },
      "Manual assignment: agent assigned",
    );

    const assignment = await assignmentRepository.createAssignment({
      orderId,
      agentId,
      assignedById,
      score: assignmentScore,
      reason: `Manually assigned by admin ${assignedById}`,
    });

    logger.info(
      {
        orderId,
        agentId,
        assignedById,
      },
      "Agent Assigned",
    );

    void notificationService.sendAgentAssigned(orderId);

    return assignment;
  },

  /**
   * REASSIGN AGENT
   */
  async reassign(
    orderId: string,
    input: { agentId?: string; reason: string },
    callerId: string,
    oldAssignmentStatus?: any,
  ): Promise<any> {
    const order = await assignmentRepository.findOrderForAssignment(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    let targetAgentId = input.agentId;
    let assignmentScore: number | null = null;
    let finalReason = input.reason;

    const fullOrder = await prisma.order.findUnique({ where: { id: orderId } });
    const orderWeight = fullOrder ? Number(fullOrder.actualWeight) : 0;
    const orderVolume = fullOrder ? Number(fullOrder.lengthCm || 0) * Number(fullOrder.widthCm || 0) * Number(fullOrder.heightCm || 0) : 0;

    if (!targetAgentId) {
      if (!order.pickupLatitude || !order.pickupLongitude) {
        throw ApiError.badRequest("Pickup coordinates are missing for auto-reassignment");
      }

      const pickupLat = Number(order.pickupLatitude);
      const pickupLng = Number(order.pickupLongitude);

      const { agents: availableAgents, radiusUsed } = await findAvailableAgentsWithRadiusExpansion({
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        baseRadius: env.AGENT_ASSIGNMENT_RADIUS_KM,
      });

      const pastAssignments = await prisma.assignment.findMany({
        where: { orderId },
        select: { agentId: true }
      });
      const excludedAgentIds = pastAssignments.map(a => a.agentId);

      // Filter: ONLINE, has capacity, not stale, not excluded
      const eligibleAgents = availableAgents.filter((a) => {
        const hasCapacity = a.availability === "ONLINE" && a.capacity > a.activeOrders;
        const isAgentStale = a.lastSeenAt !== null && (Date.now() - a.lastSeenAt.getTime()) > 5 * 60 * 1000;
        const isExcluded = excludedAgentIds.includes(a.userId);
        return hasCapacity && !isAgentStale && !isExcluded;
      });

      if (eligibleAgents.length === 0) {
        // SAFETY FALLBACK: Revert order back to CONFIRMED/PENDING queue
        await prisma.$transaction(async (tx) => {
          const activeAssignments = await tx.assignment.findMany({
            where: { orderId, status: { in: ["ACCEPTED", "PENDING"] } }
          });
          const activeAssignment = activeAssignments[0];
          if (activeAssignment) {
            await tx.assignment.update({
              where: { id: activeAssignment.id },
              data: { status: oldAssignmentStatus || "REASSIGNED" }
            });
            await tx.agentStatus.update({
              where: { userId: activeAssignment.agentId },
              data: { activeOrders: { decrement: 1 } }
            });
          }

          await tx.order.update({
            where: { id: orderId },
            data: { status: "PENDING" }
          });

          await tx.trackingEvent.create({
            data: {
              orderId,
              status: "PENDING",
              description: `Reassignment failed: No eligible agents available. Reason: ${input.reason}. Returned to queue.`,
            }
          });
        });

        let adminEmail = "admin@logistics.in";
        const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (adminUser?.email) adminEmail = adminUser.email;
        void emailService.sendAdminAlert(
          adminEmail,
          "Reassignment Failed",
          `Order #${order.orderNumber} returned to queue: No online, non-stale agents found.`
        );

        logger.warn({ orderId, reason: input.reason }, "Reassignment failed: no agents. Order returned to queue.");
        
        return null;
      }

      const scoredAgents = eligibleAgents.map((agent) =>
        scoreAgent(agent, pickupLat, pickupLng, orderWeight, orderVolume),
      );

      scoredAgents.sort((a, b) => b.totalScore - a.totalScore);
      const best = scoredAgents[0];

      targetAgentId = best.agent.userId;
      assignmentScore = best.totalScore;
      finalReason = `Auto-reassigned. Reason: ${input.reason}. Radius: ${radiusUsed}km. Score: ${best.totalScore}`;

      logger.info(
        {
          orderId,
          recommendation: {
            agentId: best.agent.userId,
            score: best.totalScore,
            distance: best.distanceKm,
          },
          candidatesCount: scoredAgents.length,
        },
        "Recommendation Generated",
      );
    } else {
      const agent = await assignmentRepository.findAgentStatus(targetAgentId);
      if (agent && order.pickupLatitude && order.pickupLongitude) {
        const scored = scoreAgent(agent, Number(order.pickupLatitude), Number(order.pickupLongitude), orderWeight, orderVolume);
        assignmentScore = scored.totalScore;
      }
    }

    const assignment = await assignmentRepository.createReassignment({
      orderId,
      newAgentId: targetAgentId,
      assignedById: callerId,
      score: assignmentScore,
      reason: finalReason,
      oldAssignmentStatus,
    });

    logger.info(
      { orderId, newAgentId: targetAgentId, callerId },
      "Order reassigned",
    );

    logger.info(
      {
        orderId,
        agentId: targetAgentId,
        assignedById: callerId,
      },
      "Agent Assigned",
    );

    void notificationService.sendAgentAssigned(orderId);

    return assignment;
  },

  /**
   * Transition assignment status from PENDING to ACCEPTED.
   */
  async acceptAssignment(assignmentId: string, callerId?: string, callerRole?: string): Promise<AssignmentResult> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw ApiError.notFound("Assignment not found");
    }

    if (callerId && callerRole !== "ADMIN" && assignment.agentId !== callerId) {
      throw ApiError.forbidden("You are not authorized to accept this assignment");
    }

    const result = await assignmentRepository.acceptAssignment(assignmentId);
    void notificationService.sendStatusUpdate(result.orderId);
    return result;
  },

  /**
   * Transition assignment status from PENDING to REJECTED and auto-reassign.
   */
  async rejectAssignment(assignmentId: string, callerId?: string, callerRole?: string): Promise<any> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw ApiError.notFound("Assignment not found");
    }

    if (callerId && callerRole !== "ADMIN" && assignment.agentId !== callerId) {
      throw ApiError.forbidden("You are not authorized to reject this assignment");
    }

    if (assignment.status !== "PENDING") {
      throw ApiError.badRequest(`Assignment is already ${assignment.status}`);
    }

    return this.reassign(
      assignment.orderId,
      { reason: "Agent rejected the assignment" },
      assignment.assignedById,
      "REJECTED"
    );
  },

  /**
   * GET CANDIDATES
   */
  async getCandidates(orderId: string): Promise<ScoredAgent[]> {
    const order = await assignmentRepository.findOrderForAssignment(orderId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Fallback to Mumbai coordinates if pickup coordinates are missing
    // TODO: This should be configurable or return an error instead of using hardcoded values
    const pickupLat = order.pickupLatitude ? Number(order.pickupLatitude) : 19.0760;
    const pickupLng = order.pickupLongitude ? Number(order.pickupLongitude) : 72.8777;

    const fullOrder = await prisma.order.findUnique({ where: { id: orderId } });
    const orderWeight = fullOrder ? Number(fullOrder.actualWeight) : 0;
    const orderVolume = fullOrder ? Number(fullOrder.lengthCm || 0) * Number(fullOrder.widthCm || 0) * Number(fullOrder.heightCm || 0) : 0;

    const availableAgents = await assignmentRepository.findAvailableAgents({
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      radiusKm: 999999, // get all online agents
    });

    const eligibleAgents = availableAgents.filter(
      (a) => a.availability === "ONLINE" && a.capacity > a.activeOrders,
    );

    const scoredAgents = eligibleAgents.map((agent) =>
      scoreAgent(agent, pickupLat, pickupLng, orderWeight, orderVolume),
    );

    scoredAgents.sort((a, b) => b.totalScore - a.totalScore);

    logger.info(
      {
        orderId,
        candidatesCount: scoredAgents.length,
      },
      "Recommendation Generated",
    );

    return scoredAgents;
  },
};
