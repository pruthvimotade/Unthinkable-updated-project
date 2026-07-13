import { describe, it, expect, vi, beforeEach } from "vitest";
import { pricingService } from "./pricing.service";
import { pricingRepository } from "./pricing.repository";
import { Decimal } from "@prisma/client/runtime/library";
import { ApiError } from "../../utils/ApiError";

// Mock the repository
vi.mock("./pricing.repository", () => ({
  pricingRepository: {
    findAreaWithZone: vi.fn(),
    findAreaByPincode: vi.fn(),
    findMatchingRateCard: vi.fn(),
  },
}));

// Mock Google Maps API
vi.mock("../../lib/googleMaps", () => ({
  getGoogleRoadDistance: vi.fn().mockResolvedValue({ distanceKm: 10, durationSeconds: 600 }),
}));

vi.mock("../../config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const ZONE_A = { id: "zone-a", name: "Zone A", code: "ZA" };
const ZONE_B = { id: "zone-b", name: "Zone B", code: "ZB" };

const AREA_A = {
  id: "area-1",
  name: "Area A",
  code: "AREA-A",
  pincode: "400001",
  zone: { id: ZONE_A.id, name: ZONE_A.name, code: ZONE_A.code },
};

const AREA_B = {
  id: "area-2",
  name: "Area B",
  code: "AREA-B",
  pincode: "400002",
  zone: { id: ZONE_B.id, name: ZONE_B.name, code: ZONE_B.code },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pricingService.calculate — Rate Card Pricing", () => {
  it("calculates rate-card price correctly for B2B intra-zone order", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_A);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-1",
      name: "Intra B2B",
      basePrice: new Decimal(45.00),
      perUnitPrice: new Decimal(0),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(10.00),
      codSurcharge: new Decimal(0),
    });

    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-2",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 5,
      orderType: "B2B",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.zoneType).toBe("INTRA_ZONE");
    expect(result.pricingSource).toBe("rate_card");
    expect(result.rateCardId).toBe("rc-1");
    expect(result.rateCardName).toBe("Intra B2B");
    expect(result.basePrice).toBe(45);
    expect(result.codCharge).toBe(0);
    expect(result.finalPrice).toBe(45);
  });

  it("calculates rate-card price correctly for B2C inter-zone order", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_B);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-2",
      name: "Inter B2C",
      basePrice: new Decimal(80.00),
      perUnitPrice: new Decimal(15.00),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(10.00),
      codSurcharge: new Decimal(20.00),
    });

    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-3",
      length: 20,
      width: 20,
      height: 20,
      actualWeight: 3,
      orderType: "B2C",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.zoneType).toBe("INTER_ZONE");
    expect(result.pricingSource).toBe("rate_card");
    expect(result.basePrice).toBe(80);
    expect(result.codCharge).toBe(0);
    expect(result.finalPrice).toBe(80);
  });

  it("pulls COD surcharge from the matched rate card for COD orders", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_A);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-1",
      name: "Intra B2B",
      basePrice: new Decimal(50.00),
      perUnitPrice: new Decimal(0),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(5.00),
      codSurcharge: new Decimal(25.50),
    });

    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-2",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 3,
      orderType: "B2B",
      paymentType: "COD",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.codCharge).toBe(25.5);
    expect(result.finalPrice).toBe(75.5);
  });

  it("calculates extra weight charge when weight exceeds maxWeight and triggers perUnitPrice", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_A);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-3",
      name: "Intra B2C Heavy",
      basePrice: new Decimal(100.00),
      perUnitPrice: new Decimal(15.00),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(5.00),
      codSurcharge: new Decimal(0),
    });

    // Billable weight is 8kg, maxWeight is 5kg. Extra weight = 3kg.
    // Base price = 100. Extra charge = 3 * 15 = 45. Subtotal = 145.
    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-2",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 8,
      orderType: "B2C",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.billableWeight).toBe(8);
    expect(result.basePrice).toBe(145);
    expect(result.finalPrice).toBe(145);
  });

  it("throws a bad request error when no rate card is configured", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_A);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce(null);

    await expect(
      pricingService.calculate({
        pickupAreaId: "area-1",
        dropAreaId: "area-2",
        length: 10,
        width: 10,
        height: 10,
        actualWeight: 5,
        orderType: "B2B",
        paymentType: "PREPAID",
        pickupLatitude: 19.076,
        pickupLongitude: 72.877,
        dropLatitude: 19.123,
        dropLongitude: 72.901,
      })
    ).rejects.toThrow(ApiError);
  });

  it("falls back to distance-based pricing (degraded mode) when areas are not mapped to zones", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await pricingService.calculate({
      pickupAreaId: "bad-area-1",
      dropAreaId: "bad-area-2",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 1,
      orderType: "B2B",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.zoneType).toBe("DISTANCE_BASED");
    expect(result.pricingSource).toBe("fallback_distance");
    expect(result.pickupZone).toBeUndefined();
    expect(result.dropZone).toBeUndefined();
    // Weight base: 1kg -> base=40. Distance: 10km -> multiplier=1.2. subtotal = 40 * 1.2 = 48.
    expect(result.basePrice).toBe(48);
    expect(result.finalPrice).toBe(48);
  });

  it("calculates rate-card price correctly for B2C intra-zone order", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_A);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-b2c-intra",
      name: "Intra B2C Light",
      basePrice: new Decimal(35.00),
      perUnitPrice: new Decimal(0),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(5.00),
      codSurcharge: new Decimal(20.00),
    });

    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-2",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 3,
      orderType: "B2C",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.zoneType).toBe("INTRA_ZONE");
    expect(result.pricingSource).toBe("rate_card");
    expect(result.rateCardId).toBe("rc-b2c-intra");
    expect(result.basePrice).toBe(35);
    expect(result.finalPrice).toBe(35);
  });

  it("calculates rate-card price correctly for B2B inter-zone order with over-weight charges", async () => {
    vi.mocked(pricingRepository.findAreaWithZone)
      .mockResolvedValueOnce(AREA_A)
      .mockResolvedValueOnce(AREA_B);

    vi.mocked(pricingRepository.findMatchingRateCard).mockResolvedValueOnce({
      id: "rc-b2b-inter-heavy",
      name: "Inter B2B Heavy",
      basePrice: new Decimal(120.00),
      perUnitPrice: new Decimal(10.00),
      minWeight: new Decimal(0),
      maxWeight: new Decimal(10.00),
      codSurcharge: new Decimal(30.00),
    });

    const result = await pricingService.calculate({
      pickupAreaId: "area-1",
      dropAreaId: "area-3",
      length: 10,
      width: 10,
      height: 10,
      actualWeight: 12,
      orderType: "B2B",
      paymentType: "PREPAID",
      pickupLatitude: 19.076,
      pickupLongitude: 72.877,
      dropLatitude: 19.123,
      dropLongitude: 72.901,
    });

    expect(result.zoneType).toBe("INTER_ZONE");
    expect(result.pricingSource).toBe("rate_card");
    expect(result.billableWeight).toBe(12);
    expect(result.basePrice).toBe(140); // 120 base + 2kg * 10
    expect(result.finalPrice).toBe(140);
  });
});
