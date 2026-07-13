import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "./logger.config";

/**
 * Per-request HTTP logger. Attaches a unique request id to every request/response
 * so a single request can be traced across all log lines.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id = (existing as string) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
