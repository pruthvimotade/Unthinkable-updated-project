import type { Decimal } from "@prisma/client/runtime/library";

// ─── Zone Classification ───────────────────────────────────────────────────

export type ZoneType = "INTRA_ZONE" | "INTER_ZONE" | "DISTANCE_BASED";

// ─── Service Input ──────────────────────────────────────────────────────────

export interface CalculatePriceInput {
  pickupAreaId?: string;
  dropAreaId?: string;
  pickupPincode?: string;
  dropPincode?: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropLatitude: number;
  dropLongitude: number;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
}

// ─── Service Output ─────────────────────────────────────────────────────────

/** Exact calculation values used for persistence and internal business logic. */
export interface PricingCalculation {
  pickupZone?: {
    id: string;
    name: string;
    code: string;
  };
  dropZone?: {
    id: string;
    name: string;
    code: string;
  };
  zoneType: ZoneType;
  actualWeight: Decimal;
  volumetricWeight: Decimal;
  billableWeight: Decimal;
  basePrice: Decimal;
  codCharge: Decimal;
  finalPrice: Decimal;
  distanceKm?: Decimal;
  estimatedDuration?: number;
  rateCardId?: string;
  rateCardName?: string;
  pricingSource: "rate_card" | "fallback_distance";
}

/** Number-shaped pricing data exposed in HTTP quote responses. */
export interface PricingBreakdown {
  pickupZone?: { id: string; name: string; code: string };
  dropZone?: { id: string; name: string; code: string };
  zoneType: ZoneType;
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  basePrice: number;
  codCharge: number;
  finalPrice: number;
  distanceKm?: number;
  estimatedDuration?: number;
  rateCardId?: string;
  rateCardName?: string;
  pricingSource: "rate_card" | "fallback_distance";
}

// ─── Repository Types ───────────────────────────────────────────────────────

export interface AreaWithZone {
  id: string;
  name: string;
  code: string;
  pincode: string;
  zone: {
    id: string;
    name: string;
    code: string;
  };
}

export interface RateCardMatch {
  id: string;
  name: string;
  basePrice: Decimal;
  perUnitPrice: Decimal | null;
  minWeight: Decimal | null;
  maxWeight: Decimal | null;
  codSurcharge: Decimal;
}
