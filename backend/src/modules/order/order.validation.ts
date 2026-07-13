import { z } from "zod";

// ─── Quote (same shape as pricing calculate) ────────────────────────────────

export const quoteSchema = z.object({
  pickupAreaId: z
    .string()
    .uuid("pickupAreaId must be a valid UUID")
    .optional(),
  pickupPincode: z
    .string()
    .optional(),
  dropAreaId: z
    .string()
    .uuid("dropAreaId must be a valid UUID")
    .optional(),
  dropPincode: z
    .string()
    .optional(),
  pickupLatitude: z.number({ required_error: "pickupLatitude is required" }),
  pickupLongitude: z.number({ required_error: "pickupLongitude is required" }),
  dropLatitude: z.number({ required_error: "dropLatitude is required" }),
  dropLongitude: z.number({ required_error: "dropLongitude is required" }),
  length: z
    .number({ required_error: "length is required" })
    .positive("length must be positive"),
  width: z
    .number({ required_error: "width is required" })
    .positive("width must be positive"),
  height: z
    .number({ required_error: "height is required" })
    .positive("height must be positive"),
  actualWeight: z
    .number({ required_error: "actualWeight is required" })
    .positive("actualWeight must be positive"),
  orderType: z.enum(["B2B", "B2C"], {
    required_error: "orderType is required",
  }),
  paymentType: z.enum(["PREPAID", "COD"], {
    required_error: "paymentType is required",
  }),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

// ─── Create Order ───────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  pickupAreaId: z
    .string()
    .uuid("pickupAreaId must be a valid UUID")
    .optional(),
  pickupPincode: z
    .string()
    .optional(),
  dropAreaId: z
    .string()
    .uuid("dropAreaId must be a valid UUID")
    .optional(),
  dropPincode: z
    .string()
    .optional(),
  pickupAddress: z
    .string({ required_error: "pickupAddress is required" })
    .trim()
    .min(1, "pickupAddress must not be empty"),
  pickupAddressLine2: z
    .string()
    .trim()
    .max(200, "pickupAddressLine2 must not exceed 200 characters")
    .optional(),
  pickupContact: z
    .string({ required_error: "pickupContact is required" })
    .trim()
    .min(1, "pickupContact must not be empty"),
  pickupLatitude: z
    .number({ required_error: "pickupLatitude is required" }),
  pickupLongitude: z
    .number({ required_error: "pickupLongitude is required" }),
  pickupPlaceId: z
    .string({ required_error: "pickupPlaceId is required" })
    .trim()
    .min(1, "pickupPlaceId must not be empty"),
  dropAddress: z
    .string({ required_error: "dropAddress is required" })
    .trim()
    .min(1, "dropAddress must not be empty"),
  dropAddressLine2: z
    .string()
    .trim()
    .max(200, "dropAddressLine2 must not exceed 200 characters")
    .optional(),
  dropContact: z
    .string({ required_error: "dropContact is required" })
    .trim()
    .min(1, "dropContact must not be empty"),
  dropLatitude: z
    .number({ required_error: "dropLatitude is required" }),
  dropLongitude: z
    .number({ required_error: "dropLongitude is required" }),
  dropPlaceId: z
    .string({ required_error: "dropPlaceId is required" })
    .trim()
    .min(1, "dropPlaceId must not be empty"),
  length: z
    .number({ required_error: "length is required" })
    .positive("length must be positive"),
  width: z
    .number({ required_error: "width is required" })
    .positive("width must be positive"),
  height: z
    .number({ required_error: "height is required" })
    .positive("height must be positive"),
  actualWeight: z
    .number({ required_error: "actualWeight is required" })
    .positive("actualWeight must be positive"),
  orderType: z.enum(["B2B", "B2C"], {
    required_error: "orderType is required",
  }),
  paymentType: z.enum(["PREPAID", "COD"], {
    required_error: "paymentType is required",
  }),
  description: z.string().trim().max(500).optional(),
  specialInstructions: z.string().trim().max(500).optional(),
  customerId: z.string().uuid().optional(), // For ADMIN override
  assignmentMode: z.enum(["AUTO", "MANUAL"]).optional().default("AUTO"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ─── Get by ID ──────────────────────────────────────────────────────────────

export const orderIdParamSchema = z.object({
  id: z
    .string({ required_error: "Order ID is required" })
    .uuid("Order ID must be a valid UUID"),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

// ─── List Orders ────────────────────────────────────────────────────────────

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "ASSIGNED",
      "PICKUP_ASSIGNED",
      "ARRIVED_AT_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "FAILED",
    ])
    .optional(),
  customerId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  orderType: z.enum(["B2B", "B2C"]).optional(),
  paymentType: z.enum(["PREPAID", "COD"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

// ─── Reschedule Order ───────────────────────────────────────────────────────

export const rescheduleOrderSchema = z.object({
  requestedDate: z
    .string({ required_error: "requestedDate is required" })
    .datetime({ message: "requestedDate must be a valid ISO 8601 datetime" }),
});

export type RescheduleOrderInput = z.infer<typeof rescheduleOrderSchema>;

