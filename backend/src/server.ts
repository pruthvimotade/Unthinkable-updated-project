import type { Server } from "http";
import { createApp } from "./app";
import { env } from "./config/env.config";
import { logger } from "./config/logger.config";
import { prisma } from "./lib/prisma";
import { cronService } from "./modules/cron/cron.service";
import { socketService } from "./modules/socket/socket.service";

const app = createApp();
cronService.start();

const server: Server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📄 API docs available at http://localhost:${env.PORT}/api-docs`);
});

socketService.init(server);

/**
 * Graceful shutdown:
 * 1. Stop accepting new connections.
 * 2. Let in-flight requests finish.
 * 3. Close the database connection.
 * 4. Exit.
 *
 * Handles both termination signals (SIGTERM from orchestrators, SIGINT from Ctrl+C)
 * and unexpected crashes (uncaughtException / unhandledRejection).
 */
let isShuttingDown = false;

async function shutdown(reason: string, exitCode: number) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Received ${reason}. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error while closing HTTP server");
    } else {
      logger.info("HTTP server closed.");
    }

    try {
      await prisma.$disconnect();
      logger.info("Database connection closed.");
    } catch (dbErr) {
      logger.error({ dbErr }, "Error while disconnecting Prisma");
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM", 0));
process.on("SIGINT", () => shutdown("SIGINT", 0));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught Exception");
  shutdown("uncaughtException", 1);
});
