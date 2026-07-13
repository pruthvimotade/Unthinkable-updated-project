import express, { type Express } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { env } from "./config/env.config";
import { httpLogger } from "./config/httpLogger.config";
import { mountSwagger } from "./config/swagger.config";
import { router } from "./routes";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";

/**
 * Builds and configures the Express application.
 * Kept separate from server.ts so the app can be imported directly
 * in tests (e.g. with supertest) without binding a real port.
 */
export function createApp(): Express {
  const app = express();

  // Trust proxy (needed for correct req.ip / secure cookies behind a load balancer)
  app.set("trust proxy", true);

  // ---- Security: Helmet (secure HTTP headers) ----
  app.use(helmet());

  // ---- Security: CORS (origins from env) ----
  // CORS_ORIGIN is a comma-separated list of allowed origins, e.g.:
  //   "http://localhost:5173" or "https://app.example.com,https://admin.example.com"
  // CORS_ORIGINS provides additional origins (also comma-separated)
  const allowedOrigins = [
    ...env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
    ...env.CORS_ORIGINS,
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
    }),
  );

  // ---- Security: Rate limiters ----

  // Strict limiter for auth endpoints: 5 requests per minute per IP
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again after 1 minute.",
    },
  });

  // Forgot password limiter: 5 requests per 15 minutes per IP
  const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many reset attempts, please try again after 15 minutes.",
    },
  });

  // General API limiter: 100 requests per minute per IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again after 1 minute.",
    },
  });

  // Apply strict limiter to auth routes before the general limiter
  app.use(`${env.API_PREFIX}/auth/login`, authLimiter);
  app.use(`${env.API_PREFIX}/auth/register`, authLimiter);
  app.use(`${env.API_PREFIX}/auth/forgot-password`, forgotPasswordLimiter);

  // Apply general limiter to all API routes
  app.use(env.API_PREFIX, generalLimiter);

  // ---- Core middleware ----
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);

  // ---- API docs ----
  mountSwagger(app);

  // ---- Routes ----
  app.use(env.API_PREFIX, router);

  // ---- 404 + Global error handler (must be last, in this order) ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
