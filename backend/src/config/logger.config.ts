import pino from "pino";
import { env } from "./env.config";

/**
 * Central application logger.
 * - JSON structured logs in production (for log aggregators / ELK / Datadog).
 * - Pretty, human-readable logs in development.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: {
    env: env.NODE_ENV,
  },
});
