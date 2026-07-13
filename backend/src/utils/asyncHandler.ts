import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route/controller handler so any rejected promise is passed
 * to `next(err)` automatically, instead of needing a try/catch in every handler.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
