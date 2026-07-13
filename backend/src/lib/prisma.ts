import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.config";

/**
 * Single shared PrismaClient instance for the whole app.
 * Cached on `global` in development so tsx's watch-mode restarts
 * don't exhaust the Postgres connection pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV === "development") {
  global.__prisma = prisma;
}
