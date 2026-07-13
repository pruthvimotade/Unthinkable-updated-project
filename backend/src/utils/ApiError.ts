/**
 * Standard application error. Throw this (or a subclass) anywhere in the app
 * and the global error handler will translate it into a consistent JSON response.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized", details?: unknown) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = "Forbidden", details?: unknown) {
    return new ApiError(403, message, details);
  }

  static notFound(message = "Not Found", details?: unknown) {
    return new ApiError(404, message, details);
  }

  static internal(message = "Internal Server Error", details?: unknown) {
    return new ApiError(500, message, details, false);
  }
}
