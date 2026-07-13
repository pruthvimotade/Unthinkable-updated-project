import { prisma } from "../../lib/prisma";
import type { OrderType, RateType } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import type { AreaWithZone, RateCardMatch } from "./pricing.types";

// ─── Select sets ────────────────────────────────────────────────────────────

const areaWithZoneSelect = {
  id: true,
  name: true,
  code: true,
  pincode: true,
  zone: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} as const;

const rateCardSelect = {
  id: true,
  name: true,
  basePrice: true,
  perUnitPrice: true,
  minWeight: true,
  maxWeight: true,
  codSurcharge: true,
} as const;

// ─── Repository ─────────────────────────────────────────────────────────────

export const pricingRepository = {
  /**
   * Fetch an area by ID, including its parent zone.
   */
  async findAreaWithZone(areaId: string): Promise<AreaWithZone | null> {
    return prisma.area.findUnique({
      where: { id: areaId, isActive: true },
      select: areaWithZoneSelect,
    });
  },

  /**
   * Fetch an area by Pincode, including its parent zone.
   */
  async findAreaByPincode(pincode: string): Promise<AreaWithZone | null> {
    return prisma.area.findFirst({
      where: { pincode, isActive: true },
      select: areaWithZoneSelect,
    });
  },

  /**
   * Find an active rate card that matches:
   *   - zone type (INTRA_ZONE / INTER_ZONE)
   *   - order type (B2B / B2C)
   *   - billable weight range
   *
   * Weight matching: minWeight <= billableWeight <= maxWeight
   * Falls back to cards with no weight range defined (null min/max).
   */
  async findMatchingRateCard(
    rateType: RateType,
    orderType: OrderType,
    billableWeight: Decimal,
  ): Promise<RateCardMatch | null> {
    // First try a weight-ranged card
    const weightRanged = await prisma.rateCard.findFirst({
      where: {
        rateType,
        orderType,
        isActive: true,
        minWeight: { lte: billableWeight },
        maxWeight: { gte: billableWeight },
      },
      select: rateCardSelect,
      orderBy: { basePrice: "asc" },
    });

    if (weightRanged) return weightRanged;

    // Try to find a card where weight exceeds the max weight (i.e. weight is above the range)
    const weightExceeded = await prisma.rateCard.findFirst({
      where: {
        rateType,
        orderType,
        isActive: true,
        minWeight: { lte: billableWeight },
        maxWeight: { lt: billableWeight },
      },
      select: rateCardSelect,
      orderBy: { maxWeight: "desc" },
    });

    if (weightExceeded) return weightExceeded;

    // Fallback: a card with no weight constraints
    return prisma.rateCard.findFirst({
      where: {
        rateType,
        orderType,
        isActive: true,
        minWeight: null,
        maxWeight: null,
      },
      select: rateCardSelect,
      orderBy: { basePrice: "asc" },
    });
  },
};
