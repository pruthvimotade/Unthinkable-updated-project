import { z } from "zod";

export const calculatePriceSchema = z.object({
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
  pickupLatitude: z.number({ required_error: "Pickup latitude is required" }),
  pickupLongitude: z.number({ required_error: "Pickup longitude is required" }),
  dropLatitude: z.number({ required_error: "Drop latitude is required" }),
  dropLongitude: z.number({ required_error: "Drop longitude is required" }),
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
    invalid_type_error: "orderType must be B2B or B2C",
  }),
  paymentType: z.enum(["PREPAID", "COD"], {
    required_error: "paymentType is required",
    invalid_type_error: "paymentType must be PREPAID or COD",
  }),
});

export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
