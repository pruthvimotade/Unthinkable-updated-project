import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { verifyAccessToken } from "./auth.service";

/**
 * Verifies the JWT from the Authorization header and attaches the
 * decoded user payload to `req.user`.
 *
 * Expected header format: `Authorization: Bearer <token>`
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed authorization header"));
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (!token) {
    return next(ApiError.unauthorized("Token not provided"));
  }

  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    status: payload.status,
  };

  next();
}

/**
 * Factory that returns middleware restricting access to specific roles.
 * Must be used AFTER `authenticate`.
 *
 * Usage:
 *   router.get("/admin-only", authenticate, authorize("ADMIN"), handler);
 *   router.get("/staff", authenticate, authorize("ADMIN", "AGENT"), handler);
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to access this resource"));
    }

    next();
  };
}
