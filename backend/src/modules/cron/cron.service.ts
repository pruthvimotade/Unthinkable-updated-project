import { prisma } from "../../lib/prisma";
import { logger } from "../../config/logger.config";
import { trackingRepository } from "../tracking/tracking.repository";
import { assignmentService } from "../assignment/assignment.service";

export const cronService = {
  start: () => {
    logger.info("Starting cron service for background tasks");
    
    // Poll every 1 minute
    setInterval(async () => {
      try {
        const now = new Date();
        
        // Find all orders that are RESCHEDULED where the requestedDate has arrived or passed
        const pendingReschedules = await prisma.reschedule.findMany({
          where: {
            requestedDate: { lte: now },
            order: { status: "RESCHEDULED" }
          },
          include: { order: true }
        });

        for (const reschedule of pendingReschedules) {
          logger.info({ orderId: reschedule.orderId }, "Processing scheduled delivery");
          
          // 1. Move status to PENDING
          await trackingRepository.createEventAndUpdateOrder({
            orderId: reschedule.orderId,
            status: "PENDING",
            description: "Scheduled delivery date arrived, moving to PENDING queue for assignment",
          });

          // 2. Trigger auto-assignment
          void assignmentService.autoAssign(reschedule.orderId, "SYSTEM").catch(err => {
             logger.error({ err, orderId: reschedule.orderId }, "Auto-assignment failed during scheduled cron");
          });
        }
      } catch (err) {
        logger.error({ err }, "Error in cron service scheduler");
      }
    }, 60 * 1000);

    // Poll every 20 seconds for expired assignments
    setInterval(async () => {
      try {
        const now = new Date();
        const expiredAssignments = await prisma.assignment.findMany({
          where: {
            status: "PENDING",
            respondByAt: { lte: now }
          }
        });

        for (const assignment of expiredAssignments) {
          logger.info({ assignmentId: assignment.id, orderId: assignment.orderId }, "Assignment response window expired, triggering reassignment");
          
          await assignmentService.reassign(
            assignment.orderId,
            { reason: "Assignment response window expired (+90s timeout)" },
            "SYSTEM",
            "EXPIRED"
          ).catch(err => {
            logger.error({ err, orderId: assignment.orderId }, "Reassignment failed for expired assignment in cron");
          });
        }
      } catch (err) {
        logger.error({ err }, "Error in assignment expiration cron check");
      }
    }, 20 * 1000);
  }
};
