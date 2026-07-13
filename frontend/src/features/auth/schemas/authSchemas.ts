import { z } from "zod";

export const portalRoleSchema = z.enum(["CUSTOMER", "ADMIN", "AGENT"]);
export type PortalRole = z.infer<typeof portalRoleSchema>;

export const dashboardPathByRole: Record<PortalRole, string> = {
  CUSTOMER: "/dashboard",
  ADMIN: "/admin",
  AGENT: "/agent",
};

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be at most 128 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .trim()
    .max(100, "Name must be at most 100 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit number")
    .optional()
    .or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
