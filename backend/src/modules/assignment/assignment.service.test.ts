/**
 * Unit tests for assignment.service.ts — scoring engine
 *
 * Covers:
 *   ✓ Closest agent wins (distance score)
 *   ✓ Offline agents are excluded
 *   ✓ Full-capacity agents are excluded
 *   ✓ Idle time tiebreaker (higher idle time scores higher)
 *   ✓ Agent with no lat/lng gets distance score of 0 but can still win on other factors
 *
 * The Prisma repository is mocked so no DB connection is needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

// ── Mock the repository ────────────────────────────────────────────────────────
vi.mock("./assignment.repository", () => ({
  assignmentRepository: {
    findOrderForAssignment: vi.fn(),
    findAvailableAgents: vi.fn(),
    createAssignment: vi.fn(),
    createReassignment: vi.fn(),
    acceptAssignment: vi.fn(),
    findAgentStatus: vi.fn(),
  },
}));

// Also mock notification so it doesn't blow up
vi.mock("../../config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../notification", () => ({
  notificationService: {
    sendAgentAssigned: vi.fn().mockResolvedValue(undefined),
    sendStatusUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../lib/prisma", () => {
  const mockPrismaObj = {
    order: {
      findUnique: vi.fn().mockResolvedValue({
        id: "ord_1",
        actualWeight: 5,
        lengthCm: 20,
        widthCm: 20,
        heightCm: 20,
      }),
      update: vi.fn(),
    },
    assignment: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    trackingEvent: {
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@logistics.in" }),
      findUnique: vi.fn(),
    },
    agentStatus: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(mockPrismaObj)),
  };
  return {
    prisma: mockPrismaObj,
  };
});

import { prisma } from "../../lib/prisma";
import { assignmentService } from "./assignment.service";
import { assignmentRepository } from "./assignment.repository";
import type { AgentCandidate } from "./assignment.types";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Mock order for assignment. */
const makeOrder = () =>
    ({
      id: "ord_1",
      orderNumber: "ORD-123",
      status: "PENDING",
      pickupLatitude: new Decimal(18.52),
      pickupLongitude: new Decimal(73.85),
      pickupArea: {
        id: "area_1",
        zone: {
          id: "zone_1",
          name: "Zone 1",
          code: "Z1",
        },
      },
    } as any);

/**
 * Build a mock agent candidate.
 * @param lat     - Agent's latitude (null = no location)
 * @param lng     - Agent's longitude (null = no location)
 * @param options - Override capacity, activeOrders, availability, lastSeenAt
 */
function makeAgent(
  id: string,
  lat: number | null,
  lng: number | null,
  options: Partial<{
    capacity: number;
    activeOrders: number;
    availability: string;
    lastSeenMinutesAgo: number | null;
    rating: number;
    acceptanceRate: number;
    vehicleType: string;
  }> = {},
): AgentCandidate {
  const {
    capacity = 5,
    activeOrders = 0,
    availability = "ONLINE",
    lastSeenMinutesAgo = 1,
    rating = 5.0,
    acceptanceRate = 100,
    vehicleType = "BIKE",
  } = options;

  return {
    userId: id,
    name: `Agent ${id}`,
    email: `agent-${id}@example.com`,
    phone: "+919999999999",
    availability,
    capacity,
    activeOrders,
    latitude: lat !== null ? new Decimal(lat) : null,
    longitude: lng !== null ? new Decimal(lng) : null,
    lastSeenAt:
      lastSeenMinutesAgo !== null
        ? new Date(Date.now() - lastSeenMinutesAgo * 60_000)
        : null,
    rating: rating,
    acceptanceRate: acceptanceRate,
    vehicleType,
  };
}

function mockCreateAssignment(agentId: string) {
  vi.mocked(assignmentRepository.createAssignment).mockResolvedValueOnce({
    id: "assign-1",
    orderId: "order-1",
    agentId,
    assignedById: "admin-1",
    status: "ACCEPTED",
    assignmentScore: new Decimal(80),
    assignmentReason: "Auto-assigned",
    assignedAt: new Date(),
    agent: { id: agentId, name: `Agent ${agentId}`, email: "a@b.com", phone: null },
    order: { id: "order-1", orderNumber: "ORD-20250710-ABC123", status: "ASSIGNED" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assignmentRepository.findOrderForAssignment).mockResolvedValue(makeOrder());
  vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValue([]);
});

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe("assignmentService.autoAssign — scoring engine", () => {
  describe("Closest agent wins", () => {
    it("selects the agent physically closest to the pickup area", async () => {
      /**
       * Pickup is at (18.94, 72.82) — Mumbai Central.
       * Agent A is at (18.95, 72.83) — very close (≈1.5 km)
       * Agent B is at (19.30, 73.10) — far away (≈50 km)
       * Both are ONLINE with spare capacity. Agent A should win.
       */
      const agentA = makeAgent("agent-a", 18.95, 72.83);
      const agentB = makeAgent("agent-b", 19.30, 73.10);

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      mockCreateAssignment("agent-a");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-a" }),
      );
    });
  });

  describe("Offline agents excluded", () => {
    it("skips OFFLINE agents entirely", async () => {
      /**
       * Agent A is OFFLINE but very close.
       * Agent B is ONLINE but far.
       * Agent B must win since Agent A is offline.
       */
      const agentA = makeAgent("agent-a", 18.95, 72.83, { availability: "OFFLINE" });
      const agentB = makeAgent("agent-b", 19.50, 73.20, { availability: "ONLINE" });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      mockCreateAssignment("agent-b");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-b" }),
      );
    });

    it("throws 400 when no ONLINE agents are available", async () => {
      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([]);

      await expect(
        assignmentService.autoAssign("order-1", "admin-1"),
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("No available") });
    });
  });

  describe("Full-capacity agents excluded", () => {
    it("skips agents where activeOrders >= capacity", async () => {
      /**
       * Agent A is close but FULL (capacity=2, activeOrders=2).
       * Agent B is far but has capacity.
       * Agent B must win.
       */
      const agentA = makeAgent("agent-a", 18.95, 72.83, { capacity: 2, activeOrders: 2 });
      const agentB = makeAgent("agent-b", 19.50, 73.20, { capacity: 5, activeOrders: 1 });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      mockCreateAssignment("agent-b");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-b" }),
      );
    });

    it("throws 400 when all agents are at full capacity", async () => {
      const fullAgent = makeAgent("agent-full", 18.95, 72.83, { capacity: 1, activeOrders: 1 });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([fullAgent]);

      await expect(
        assignmentService.autoAssign("order-1", "admin-1"),
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("capacity") });
    });
  });

  describe("Weighted rating and acceptance rate tiebreaker", () => {
    it("prefers the agent who has a higher rating when distance is equal", async () => {
      /**
       * Both agents are at exactly the same location → same distance score.
       * Agent A has rating 3.5.
       * Agent B has rating 4.9 → should win.
       */
      const agentA = makeAgent("agent-a", 18.94, 72.82, { rating: 3.5 });
      const agentB = makeAgent("agent-b", 18.94, 72.82, { rating: 4.9 });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      mockCreateAssignment("agent-b");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-b" }),
      );
    });

    it("prefers the agent who has a higher acceptance rate when distance and rating are equal", async () => {
      /**
       * Both agents at same distance and rating.
       * Agent A has acceptance rate 80%.
       * Agent B has acceptance rate 95% → should win.
       */
      const agentA = makeAgent("agent-a", 18.94, 72.82, { rating: 4.5, acceptanceRate: 80 });
      const agentB = makeAgent("agent-b", 18.94, 72.82, { rating: 4.5, acceptanceRate: 95 });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      mockCreateAssignment("agent-b");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-b" }),
      );
    });
  });

  describe("Agent with no location", () => {
    it("assigns distance score of 0 to agent without lat/lng, but can still be assigned", async () => {
      /**
       * Only one agent available, and they have no location.
       * Should be assigned (distance score = 0) since no other candidates.
       */
      const noLocAgent = makeAgent("agent-no-loc", null, null);

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([noLocAgent]);
      mockCreateAssignment("agent-no-loc");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-no-loc" }),
      );
    });
  });

  describe("Order status validation", () => {
    it("throws 400 when order is already ASSIGNED", async () => {
      const alreadyAssigned = { ...makeOrder(), status: "ASSIGNED" };
      vi.mocked(assignmentRepository.findOrderForAssignment).mockResolvedValueOnce(alreadyAssigned);

      await expect(
        assignmentService.autoAssign("order-1", "admin-1"),
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("status") });
    });

    it("throws 404 when order does not exist", async () => {
      vi.mocked(assignmentRepository.findOrderForAssignment).mockResolvedValueOnce(null);

      await expect(
        assignmentService.autoAssign("order-1", "admin-1"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("Dynamic Assignment Extensions", () => {
    it("autoAssign retry with radius expansion (base -> 2x -> 3x)", async () => {
      const mockAgentObj = makeAgent("agent-far", 18.60, 73.90);
      
      vi.mocked(assignmentRepository.findAvailableAgents)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockAgentObj]);
      
      mockCreateAssignment("agent-far");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.findAvailableAgents).toHaveBeenCalledTimes(3);
      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-far" }),
      );
    });

    it("penalizes stale agents (>5 minutes last seen) and excludes them from auto-assignment", async () => {
      const activeAgent = makeAgent("agent-online", 18.52, 73.85, { lastSeenMinutesAgo: 2 });
      const staleAgent = makeAgent("agent-stale", 18.52, 73.85, { lastSeenMinutesAgo: 10 });

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([activeAgent, staleAgent]);
      mockCreateAssignment("agent-online");

      await assignmentService.autoAssign("order-1", "admin-1");

      expect(assignmentRepository.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent-online" }),
      );
    });

    it("excludes past assigned agents on reassignment", async () => {
      const agentA = makeAgent("agent-a", 18.52, 73.85);
      const agentB = makeAgent("agent-b", 18.52, 73.85);

      vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce([{ agentId: "agent-a" }] as any);

      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA, agentB]);
      vi.mocked(assignmentRepository.createReassignment).mockResolvedValueOnce({} as any);

      await assignmentService.reassign("order-1", { reason: "test reject" }, "admin-1");

      expect(assignmentRepository.createReassignment).toHaveBeenCalledWith(
        expect.objectContaining({ newAgentId: "agent-b" }),
      );
    });

    it("falls back to safety queue if no eligible agents are left for reassignment", async () => {
      const agentA = makeAgent("agent-a", 18.52, 73.85);
      
      vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce([{ agentId: "agent-a" }] as any);
      vi.mocked(assignmentRepository.findAvailableAgents).mockResolvedValueOnce([agentA]);
      
      const result = await assignmentService.reassign("order-1", { reason: "fallback test" }, "admin-1");

      expect(result).toBeNull();
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "PENDING" }
      });
    });

    it("accepts a pending assignment", async () => {
      vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
        id: "asg-1",
        orderId: "ord-1",
        agentId: "agent-1",
        status: "PENDING",
      } as any);

      vi.mocked(assignmentRepository.acceptAssignment).mockResolvedValueOnce({
        id: "asg-1",
        orderId: "ord-1",
      } as any);

      const result = await assignmentService.acceptAssignment("asg-1");

      expect(assignmentRepository.acceptAssignment).toHaveBeenCalledWith("asg-1");
      expect(result.id).toBe("asg-1");
    });
  });
});
