import "dotenv/config";
import { z } from "zod";

/**
 * Defines and validates every environment variable the application needs.
 * The process exits immediately if a required variable is missing or malformed,
 * so misconfiguration is caught at boot time, not at runtime deep in a request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("/api/v1"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1d"),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email("SMTP_FROM must be a valid email address").default("no-reply@logistics.in"),
  
  TWILIO_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGIN: z.string().trim().optional(),

  /** Additional CORS origins (comma-separated) for development. */
  CORS_ORIGINS: z.string().trim().optional(),

  /** Maximum straight-line distance for auto-assignment candidates. */
  AGENT_ASSIGNMENT_RADIUS_KM: z.coerce.number().positive().max(200).default(50),

  /** Enables privileged account creation only for explicitly configured local demos. */
  ALLOW_PRIVILEGED_SELF_REGISTRATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  /** Skip email verification in development mode for testing. */
  SKIP_EMAIL_VERIFICATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== "development" && !value.CORS_ORIGIN) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CORS_ORIGIN"],
      message: "CORS_ORIGIN is required outside development",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Local Vite is the only implicit browser origin. Deployed environments
  // must opt in to every allowed frontend origin through CORS_ORIGIN.
  CORS_ORIGIN: parsed.data.CORS_ORIGIN ?? parsed.data.FRONTEND_URL,
  // Parse CORS_ORIGINS into an array if provided
  CORS_ORIGINS: parsed.data.CORS_ORIGINS
    ? parsed.data.CORS_ORIGINS.split(',').map(o => o.trim())
    : [],
};
export type Env = typeof env;
