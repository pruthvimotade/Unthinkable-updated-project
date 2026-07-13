import { z } from "zod";

// ─── Route Params ───────────────────────────────────────────────────────────

export const orderIdParamSchema = z.object({
  orderId: z
    .string({ required_error: "orderId is required" })
    .uuid("orderId must be a valid UUID"),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

// ─── Update Status Body ─────────────────────────────────────────────────────

export const updateStatusSchema = z.object({
  status: z.enum(
    [
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
    ],
    {
      required_error: "status is required",
      invalid_type_error: "Invalid order status",
    },
  ),
  description: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
