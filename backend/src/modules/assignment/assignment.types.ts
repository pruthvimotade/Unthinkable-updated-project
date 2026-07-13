import type { Decimal } from "@prisma/client/runtime/library";

// ─── Agent Candidate (from repository) ──────────────────────────────────────

export interface AgentCandidate {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  availability: string;
  capacity: number;
  activeOrders: number;
  latitude: Decimal | null;
  longitude: Decimal | null;
  lastSeenAt: Date | null;
  rating?: number;
  acceptanceRate?: number;
  vehicleType?: string;
}

// ─── Order for Assignment (from repository) ─────────────────────────────────

export interface OrderForAssignment {
  id: string;
  orderNumber: string;
  status: string;
  pickupLatitude: import("@prisma/client/runtime/library").Decimal | null;
  pickupLongitude: import("@prisma/client/runtime/library").Decimal | null;
  pickupArea?: {
    id: string;
    zone: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

export interface ScoredAgent {
  agent: AgentCandidate;
  distanceScore: number;
  availabilityScore: number;
  capacityScore: number;
  idleTimeScore: number;
  activeDeliveriesScore?: number;
  ratingScore?: number;
  acceptanceRateScore?: number;
  vehicleSuitabilityScore?: number;
  totalScore: number;
  distanceKm?: number;
  isStale?: boolean;
}

// ─── Service Input ──────────────────────────────────────────────────────────

export interface ManualAssignInput {
  agentId: string;
}

// ─── Service Output ─────────────────────────────────────────────────────────

export interface AssignmentResult {
  id: string;
  orderId: string;
  agentId: string;
  assignedById: string;
  status: string;
  assignmentScore: Decimal | null;
  assignmentReason: string | null;
  assignedAt: Date;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
}
