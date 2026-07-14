import type { Server } from "http";
import { createApp } from "./app";
import { env } from "./config/env.config";
import { logger } from "./config/logger.config";
import { prisma } from "./lib/prisma";
import { cronService } from "./modules/cron/cron.service";
import { socketService } from "./modules/socket/socket.service";

// Phase 1: Database diagnostics on startup
async function logDatabaseDiagnostics() {
  try {
    // Log masked DATABASE_URL
    const dbUrl = env.DATABASE_URL;
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    logger.info({ maskedUrl }, "[DIAGNOSTIC] DATABASE_URL (masked)");

    // Test database connection
    await prisma.$connect();
    logger.info("[DIAGNOSTIC] Database connected successfully");

    // Log total user count
    const userCount = await prisma.user.count();
    logger.info({ userCount }, "[DIAGNOSTIC] Total users in database");

    // Log all users (email + role)
    const users = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    logger.info({ users: users.map(u => `${u.email} ${u.role}`) }, "[DIAGNOSTIC] All users in database");

    // Log other entity counts for comparison
    const orderCount = await prisma.order.count();
    const zoneCount = await prisma.zone.count();
    const areaCount = await prisma.area.count();
    const agentCount = await prisma.user.count({ where: { role: 'AGENT' } });
    
    logger.info({ 
      orderCount, 
      zoneCount, 
      areaCount, 
      agentCount 
    }, "[DIAGNOSTIC] Database entity counts");

  } catch (error) {
    logger.error({ error }, "[DIAGNOSTIC] Database diagnostics failed");
    throw error;
  }
}

const app = createApp();
cronService.start();

let server: Server | null = null;

// Run diagnostics before starting server
logDatabaseDiagnostics().then(() => {
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📄 API docs available at http://localhost:${env.PORT}/api-docs`);
  });

  socketService.init(server);
}).catch((error) => {
  logger.error({ error }, "[DIAGNOSTIC] Failed to start server due to database diagnostics");
  process.exit(1);
});

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

  if (server) {
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
  } else {
    // Server not started yet, just exit
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  }
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
