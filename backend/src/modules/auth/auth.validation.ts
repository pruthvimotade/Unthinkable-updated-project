import { z } from "zod";

export const portalRoleSchema = z.enum(["CUSTOMER", "ADMIN", "AGENT"]);
export type PortalRole = z.infer<typeof portalRoleSchema>;

const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+91)?[6-9]\d{9}$/, "Invalid Indian mobile number")
  .transform((value) => (value.startsWith("+91") ? value : `+91${value}`));

// ─── Register ───────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  phone: indianPhoneSchema.optional(),
  role: portalRoleSchema.default("CUSTOMER"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Verification & Recovery ───────────────────────────────────────────────

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: "Token is required" }).min(1, "Token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Token is required" }).min(1, "Token is required"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

