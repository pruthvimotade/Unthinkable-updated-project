import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Catches any request that didn't match a registered route and forwards
 * a 404 ApiError to the global error handler, keeping the response shape consistent.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}
