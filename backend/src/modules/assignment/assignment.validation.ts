import { z } from "zod";

// ─── Route Params ───────────────────────────────────────────────────────────

export const orderIdParamSchema = z.object({
  orderId: z
    .string({ required_error: "orderId is required" })
    .uuid("orderId must be a valid UUID"),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

// ─── Manual Assignment Body ─────────────────────────────────────────────────

export const manualAssignSchema = z.object({
  agentId: z
    .string({ required_error: "Agent ID is required" })
    .uuid("Agent ID must be a valid UUID"),
});

export const reassignSchema = z.object({
  agentId: z.string().uuid("Agent ID must be a valid UUID").optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters long"),
});

export type ManualAssignInput = z.infer<typeof manualAssignSchema>;
