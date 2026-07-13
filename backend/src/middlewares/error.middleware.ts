import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env.config";

/**
 * Single place where every error in the app (thrown, or passed via next(err))
 * is turned into a consistent JSON response. Must be registered LAST,
 * after all routes, per Express error-handling middleware rules.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const isApiError = err instanceof ApiError;

  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "Internal Server Error";
  const details = isApiError ? err.details : undefined;

  req.log?.error({ err, statusCode }, "Request error");

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    // Stack traces only leak in non-production environments.
    ...(env.NODE_ENV !== "production" && err instanceof Error ? { stack: err.stack } : {}),
  });
}
