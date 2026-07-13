import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

type RequestPart = "body" | "query" | "params";

/**
 * Generic validation middleware factory.
 * Usage in a future feature module:
 *
 *   router.post("/orders", validate(createOrderSchema), createOrderController)
 *
 * where `createOrderSchema` is a Zod schema. Validation errors are normalized
 * into an ApiError(400) and forwarded to the global error handler.
 */
export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return next(ApiError.badRequest("Validation failed", result.error.flatten()));
    }

    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
}
