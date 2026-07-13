import { z } from "zod";

export const addressSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Invalid Indian mobile number"),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().max(200, "Must not exceed 200 characters").optional().or(z.literal("")),
  pincode: z.string().min(1, "Please select an address with a valid pincode"),
  latitude: z.number({ message: "Address coordinates are required" }),
  longitude: z.number({ message: "Address coordinates are required" }),
  placeId: z.string().min(1, "Address Place ID is required"),
});

export const orderFormSchema = z.object({
  pickup: addressSchema,
  drop: addressSchema,
  packageDetails: z.object({
    length: z.number().positive("Must be positive"),
    width: z.number().positive("Must be positive"),
    height: z.number().positive("Must be positive"),
    actualWeight: z.number().positive("Must be positive"),
    orderType: z.enum(["B2B", "B2C"]),
    paymentType: z.enum(["PREPAID", "COD"]),
  }),
  customerId: z.string().uuid("Please select a customer").optional(),
  assignmentMode: z.enum(["AUTO", "MANUAL"]).optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
