/**
 * DECIMAL STRATEGY:
 * Prices and billable weights stay as Decimal values through calculation and order
 * persistence. Native numbers are only created by calculate() for quote responses.
 * Currency is rounded half-up to paise and weights to three decimal places.
 */
import { Decimal } from "@prisma/client/runtime/library";
import { RateType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../config/logger.config";
import { pricingRepository } from "./pricing.repository";
import type {
  CalculatePriceInput,
  PricingCalculation,
  PricingBreakdown,
  ZoneType,
} from "./pricing.types";
import { getGoogleRoadDistance } from "../../lib/googleMaps";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Divisor for volumetric weight: (L × W × H) / DIVISOR */
const VOLUMETRIC_DIVISOR = 5000;
const WEIGHT_DECIMAL_PLACES = 3;
const CURRENCY_DECIMAL_PLACES = 2;

const getBasePriceByWeight = (weight: number): number => {
  if (weight <= 1) return 40;
  if (weight <= 3) return 50;
  if (weight <= 5) return 65;
  if (weight <= 10) return 90;
  if (weight <= 15) return 120;
  if (weight <= 20) return 150;
  if (weight <= 25) return 180;
  if (weight <= 30) return 220;
  return 250 + Math.ceil(weight - 30) * 10;
};

const getDistanceMultiplier = (distanceKm: number): number => {
  if (distanceKm <= 5) return 1.0;
  if (distanceKm <= 10) return 1.2;
  if (distanceKm <= 20) return 1.5;
  if (distanceKm <= 30) return 2.0;
  return 2.5;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ─── Service ────────────────────────────────────────────────────────────────

export const pricingService = {
  /**
   * Calculate a quote for an HTTP response.
   */
  async calculate(input: CalculatePriceInput): Promise<PricingBreakdown> {
    return toPricingBreakdown(await calculatePrecisely(input));
  },

  /** Calculate exact values for order creation and Prisma persistence. */
  async calculateForOrder(input: CalculatePriceInput): Promise<PricingCalculation> {
    return calculatePrecisely(input);
  },

  /** Resolve an active Area by pincode. */
  async resolveAreaByPincode(pincode: string): Promise<any> {
    return pricingRepository.findAreaByPincode(pincode);
  },
};

async function calculatePrecisely(input: CalculatePriceInput): Promise<PricingCalculation> {
  // ── 1. Area lookups for analytics (DO NOT BLOCK IF NULL) ────────
  let pickupArea = null;
  let dropArea = null;

  try {
    if (input.pickupAreaId) pickupArea = await pricingRepository.findAreaWithZone(input.pickupAreaId);
    else if (input.pickupPincode) pickupArea = await pricingRepository.findAreaByPincode(input.pickupPincode);
  } catch (err) { logger.warn("Failed to find pickup area"); }
  
  try {
    if (input.dropAreaId) dropArea = await pricingRepository.findAreaWithZone(input.dropAreaId);
    else if (input.dropPincode) dropArea = await pricingRepository.findAreaByPincode(input.dropPincode);
  } catch (err) { logger.warn("Failed to find drop area"); }

  // ── 2. Zone classification ──────────────────────────────────────────
  let zoneType: ZoneType = "DISTANCE_BASED";
  if (pickupArea && dropArea) {
    zoneType = pickupArea.zone.id === dropArea.zone.id ? "INTRA_ZONE" : "INTER_ZONE";
  }

  // ── 3. Volumetric & Billable Weight ───────────────────────────────
  const length = decimalFromInput(input.length).toDecimalPlaces(2);
  const width = decimalFromInput(input.width).toDecimalPlaces(2);
  const height = decimalFromInput(input.height).toDecimalPlaces(2);
  const actualWeight = decimalFromInput(input.actualWeight).toDecimalPlaces(WEIGHT_DECIMAL_PLACES);

  const volumetricWeight = length
    .mul(width)
    .mul(height)
    .div(VOLUMETRIC_DIVISOR)
    .toDecimalPlaces(WEIGHT_DECIMAL_PLACES);

  const billableWeight = Decimal.max(actualWeight, volumetricWeight).toDecimalPlaces(WEIGHT_DECIMAL_PLACES);

  // ── 4. Distance Calculation ─────────────────────────────────────────
  let distanceKm = 0;
  let durationSeconds = 0;

  const googleDist = await getGoogleRoadDistance(
    input.pickupLatitude,
    input.pickupLongitude,
    input.dropLatitude,
    input.dropLongitude
  );

  if (googleDist) {
    distanceKm = googleDist.distanceKm;
    durationSeconds = googleDist.durationSeconds;
  } else {
    logger.warn("Google Distance API failed, falling back to Haversine");
    distanceKm = haversineDistance(
      input.pickupLatitude,
      input.pickupLongitude,
      input.dropLatitude,
      input.dropLongitude
    );
  }

  // ── 5. Price calculation ────────────────────────────────────────────
  let subtotal = new Decimal(0);
  let codCharge = new Decimal(0);
  let finalPrice = new Decimal(0);
  let rateCardId: string | undefined;
  let rateCardName: string | undefined;
  let pricingSource: "rate_card" | "fallback_distance" = "fallback_distance";

  if (zoneType === "INTRA_ZONE" || zoneType === "INTER_ZONE") {
    const rateType = zoneType === "INTRA_ZONE" ? RateType.INTRA_ZONE : RateType.INTER_ZONE;
    const rateCard = await pricingRepository.findMatchingRateCard(rateType, input.orderType, billableWeight);
    
    if (!rateCard) {
      throw ApiError.badRequest("No active rate card configured for this zone/order type — contact admin");
    }

    pricingSource = "rate_card";
    rateCardId = rateCard.id;
    rateCardName = rateCard.name;

    const basePrice = new Decimal(rateCard.basePrice.toString());
    let extraCharge = new Decimal(0);

    if (rateCard.maxWeight !== null && billableWeight.gt(rateCard.maxWeight)) {
      const perUnitPrice = rateCard.perUnitPrice ? new Decimal(rateCard.perUnitPrice.toString()) : null;
      if (perUnitPrice && perUnitPrice.gt(0)) {
        const extraWeight = billableWeight.sub(rateCard.maxWeight);
        extraCharge = extraWeight.mul(perUnitPrice);
      }
    }

    subtotal = basePrice.add(extraCharge).toDecimalPlaces(CURRENCY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
    codCharge = input.paymentType === "COD" ? new Decimal(rateCard.codSurcharge.toString()) : new Decimal(0);
    finalPrice = subtotal.add(codCharge).toDecimalPlaces(CURRENCY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);

    logger.info(
      {
        rateCardId,
        rateCardName,
        zoneType,
        billableWeight: billableWeight.toString(),
        finalPrice: finalPrice.toString(),
      },
      "Price calculated via Rate Card"
    );
  } else {
    // FALLBACK: DISTANCE_BASED
    logger.warn(
      {
        pickupPincode: input.pickupPincode,
        dropPincode: input.dropPincode,
        pickupAreaId: input.pickupAreaId,
        dropAreaId: input.dropAreaId,
      },
      "Order priced outside the zone rate-card system — falling back to distance pricing"
    );

    const basePriceValue = getBasePriceByWeight(billableWeight.toNumber());
    const distanceMultiplier = getDistanceMultiplier(distanceKm);
    
    const subtotalValue = basePriceValue * distanceMultiplier;
    subtotal = new Decimal(subtotalValue).toDecimalPlaces(CURRENCY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
    codCharge = input.paymentType === "COD" ? new Decimal(50) : new Decimal(0); // Using 50 default COD surcharge
    finalPrice = subtotal.add(codCharge).toDecimalPlaces(CURRENCY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);

    logger.info(
      {
        zoneType,
        billableWeight: billableWeight.toString(),
        distanceKm,
        finalPrice: finalPrice.toString(),
      },
      "Price calculated via Google/Haversine Distance (degraded fallback)"
    );
  }

  return {
    pickupZone: pickupArea ? {
      id: pickupArea.zone.id,
      name: pickupArea.zone.name,
      code: pickupArea.zone.code,
    } : undefined,
    dropZone: dropArea ? {
      id: dropArea.zone.id,
      name: dropArea.zone.name,
      code: dropArea.zone.code,
    } : undefined,
    zoneType,
    actualWeight,
    volumetricWeight,
    billableWeight,
    basePrice: subtotal,
    codCharge,
    finalPrice,
    distanceKm: new Decimal(distanceKm),
    estimatedDuration: durationSeconds,
    rateCardId,
    rateCardName,
    pricingSource,
  };
}

function decimalFromInput(value: number): Decimal {
  return new Decimal(value.toString());
}

function toPricingBreakdown(calculation: PricingCalculation): PricingBreakdown {
  return {
    ...calculation,
    actualWeight: calculation.actualWeight.toNumber(),
    volumetricWeight: calculation.volumetricWeight.toNumber(),
    billableWeight: calculation.billableWeight.toNumber(),
    basePrice: calculation.basePrice.toNumber(),
    codCharge: calculation.codCharge.toNumber(),
    finalPrice: calculation.finalPrice.toNumber(),
    distanceKm: calculation.distanceKm?.toNumber(),
    estimatedDuration: calculation.estimatedDuration,
    rateCardId: calculation.rateCardId,
    rateCardName: calculation.rateCardName,
    pricingSource: calculation.pricingSource,
  };
}
