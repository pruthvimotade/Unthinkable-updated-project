import { z } from "zod";

export const createZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "AGENT", "CUSTOMER"], {
    required_error: "Role is required and must be ADMIN, AGENT, or CUSTOMER",
  }),
});

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["ADMIN", "CUSTOMER", "AGENT", "DISPATCHER", "WAREHOUSE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]).optional(),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid Indian PIN code"),
  zoneId: z.string().uuid("Invalid zone ID"),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});

export const updateAreaSchema = createAreaSchema.partial();

export const createRateCardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rateType: z.enum(["BASE", "PER_KG", "PER_KM", "FLAT", "INTRA_ZONE", "INTER_ZONE"]),
  orderType: z.enum(["B2B", "B2C"]),
  basePrice: z.number().positive("Base price must be positive"),
  perUnitPrice: z.number().nonnegative("Per unit price cannot be negative").optional(),
  minWeight: z.number().nonnegative().optional(),
  maxWeight: z.number().nonnegative().optional(),
  codSurcharge: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateRateCardSchema = createRateCardSchema.partial();

export const updateAgentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]),
});

export const getAnalyticsQuerySchema = z.object({
  dateRange: z.enum(["today", "week", "month", "all"]).optional(),
});

export const overrideTrackingSchema = z.object({
  toStatus: z.enum([
    "PENDING",
    "CONFIRMED",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "FAILED",
    "RESCHEDULED",
  ]),
  reason: z.string().min(1, "Reason is required"),
});
