import { logger } from "../../config/logger.config";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env.config";
import { emailService } from "../../email/email.service";
import { smsProvider } from "./sms.provider";

async function logNotification(userId: string, channel: "EMAIL" | "SMS" | "IN_APP", title: string, body: string, status: "SENT" | "FAILED" | "PENDING" = "SENT") {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        channel,
        title,
        body,
        status,
      }
    });

    if (channel === "IN_APP") {
      import("../socket/socket.service.js").then(({ socketService }) => {
        socketService.emitToRoom(`user_${userId}`, "notification", notification);
      }).catch(err => logger.error({ err }, "Socket service not found"));
    }
  } catch (err) {
    logger.error({ err, userId, channel }, "Failed to log notification to database");
  }
}

async function processNotification(orderId: string) {
  try {
    // 1. Fetch order and relations (including PENDING and ACCEPTED assignments)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        assignments: {
          include: { agent: true },
          orderBy: { assignedAt: "desc" },
        }
      },
    });

    if (!order) {
      logger.error({ orderId }, "Order not found during notification processing");
      return;
    }

    // 2. Fetch history for previous status
    const trackingEvents = await prisma.trackingEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    const currentStatus = order.status;
    const previousStatus = trackingEvents[1]?.status || "PENDING";

    // Emit real-time tracking update
    import("../socket/socket.service.js").then(({ socketService }) => {
      socketService.emitToRoom(`order_${orderId}`, "orderUpdate", { orderId, status: currentStatus });
      socketService.emitToRoom(`admin`, "orderUpdate", { orderId, status: currentStatus });
    }).catch(err => logger.error({ err }, "Socket service not found"));

    // Resolve active agent and admin details
    const activeAssignment = order.assignments.find(a => ["ACCEPTED", "PENDING"].includes(a.status));
    const activeAgent = activeAssignment?.agent;

    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const adminEmail = adminUser?.email || "admin@logistics.in";
    const adminId = adminUser?.id;

    // Check if it's an admin override
    const isOverride = trackingEvents[0]?.description?.includes("Status overridden by Admin") || false;

    // A. ORDER CREATION EVENT
    const isJustCreated = trackingEvents.length <= 1 && currentStatus === "PENDING";
    if (isJustCreated) {
      if (order.customer.email) {
        try {
          await emailService.sendOrderCreatedEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            order.actualWeight ? Number(order.actualWeight) : 0,
            order.calculatedPrice ? Number(order.calculatedPrice) : 0,
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Order Booked - #${order.orderNumber}`, `Confirmation email sent to ${order.customer.email}`);
        } catch (err) {
          logger.warn({ err, email: order.customer.email }, "Email send failed - logging as failed notification");
          await logNotification(order.customerId, "EMAIL", `Order Booked - #${order.orderNumber}`, `Failed to send email to ${order.customer.email}`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Order Booked successfully`, `Your order #${order.orderNumber} has been created and is awaiting agent assignment.`);

      if (adminId) {
        await logNotification(adminId, "IN_APP", `New Order Booked`, `Customer ${order.customer.name} booked a new order #${order.orderNumber}.`);
      }
      return;
    }

    // B. AGENT ASSIGNED EVENT
    if (currentStatus === "ASSIGNED" && activeAgent) {
      if (order.customer.email) {
        try {
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            "ASSIGNED",
            previousStatus,
            "N/A",
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Delivery Agent Assigned`, `Email dispatched to ${order.customer.email}`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Delivery Agent Assigned`, `Failed to send email`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Agent Assigned`, `Agent ${activeAgent.name} has been assigned to deliver your order #${order.orderNumber}.`);

      if (activeAgent.email) {
        try {
          await emailService.sendAgentAssignmentEmail(
            activeAgent.email,
            activeAgent.name,
            order.orderNumber,
            order.pickupAddress,
            order.dropAddress,
            order.pickupContact || order.customer.phone || "N/A"
          );
          await logNotification(activeAgent.id, "EMAIL", `New Assignment: #${order.orderNumber}`, `Assignment details email sent to ${activeAgent.email}`);
        } catch (err) {
          await logNotification(activeAgent.id, "EMAIL", `New Assignment: #${order.orderNumber}`, `Failed to send email`, "FAILED");
        }
      }
      await logNotification(activeAgent.id, "IN_APP", `New Delivery Assigned`, `You have been assigned order #${order.orderNumber}. Please respond within the acceptance window.`);

      if (adminId) {
        await logNotification(adminId, "IN_APP", `Order Assigned`, `Order #${order.orderNumber} has been assigned to agent ${activeAgent.name}.`);
      }

      const previousAssignments = order.assignments.filter(a => ["REASSIGNED", "EXPIRED", "REJECTED"].includes(a.status));
      if (previousAssignments.length > 0) {
        const prevAgent = previousAssignments[0].agent;
        if (prevAgent) {
          await logNotification(prevAgent.id, "IN_APP", `Order Reassigned Away`, `Order #${order.orderNumber} has been reassigned to another driver.`);
        }
      }
      return;
    }

    // C. ADMIN STATUS OVERRIDE
    if (isOverride) {
      if (order.customer.email) {
        try {
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            currentStatus,
            previousStatus,
            "N/A",
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Status Overridden: ${currentStatus}`, `Notified customer of override via email`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Status Overridden: ${currentStatus}`, `Failed to email customer`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Order Status Updated`, `An administrator has overridden the status of your order #${order.orderNumber} to ${currentStatus}.`);

      if (activeAgent) {
        await logNotification(activeAgent.id, "IN_APP", `Order Status Overridden`, `Admin has changed order #${order.orderNumber} status to ${currentStatus}.`);
      }
      return;
    }

    // D. TRANSIT / LFC STATUS TRANSITIONS
    if (["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(currentStatus)) {
      if (order.customer.email) {
        try {
          const estDelivery = order.estimatedDuration 
            ? new Date(Date.now() + Number(order.estimatedDuration) * 1000).toLocaleString()
            : "N/A";
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            currentStatus,
            previousStatus,
            estDelivery,
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Order Update: ${currentStatus}`, `Email sent to ${order.customer.email}`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Order Update: ${currentStatus}`, `Failed to email customer`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Order ${currentStatus.replace(/_/g, " ")}`, `Your order #${order.orderNumber} is now ${currentStatus.replace(/_/g, " ").toLowerCase()}.`);

      if (adminId) {
        await logNotification(adminId, "IN_APP", `Order Status: ${currentStatus}`, `Order #${order.orderNumber} moved to ${currentStatus}.`);
      }
    }

    // E. DELIVERED
    if (currentStatus === "DELIVERED") {
      if (order.customer.email) {
        try {
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            "DELIVERED",
            previousStatus,
            "Completed",
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Order Delivered!`, `Delivery confirmation sent to ${order.customer.email}`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Order Delivered!`, `Failed to email customer`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Order Delivered`, `Your order #${order.orderNumber} has been delivered successfully.`);

      if (activeAgent) {
        await logNotification(activeAgent.id, "IN_APP", `Delivery Completed`, `Great job! You have successfully completed order #${order.orderNumber}.`);
      }

      if (adminId) {
        await logNotification(adminId, "IN_APP", `Order Delivered`, `Order #${order.orderNumber} has been marked DELIVERED.`);
      }
    }

    // F. FAILED
    if (currentStatus === "FAILED") {
      if (order.customer.email) {
        try {
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            "FAILED",
            previousStatus,
            "Reschedule required",
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Delivery Attempt Failed`, `Failure notification email sent`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Delivery Attempt Failed`, `Failed to email customer`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Delivery Failed`, `Delivery attempt for order #${order.orderNumber} failed. Please reschedule it for a new date.`);

      if (activeAgent) {
        await logNotification(activeAgent.id, "IN_APP", `Delivery Failed`, `Delivery attempt failed for order #${order.orderNumber}.`);
      }

      try {
        await emailService.sendAdminAlert(
          adminEmail,
          "Failed Delivery Alert",
          `Order #${order.orderNumber} has failed delivery status update.`
        );
        if (adminId) {
          await logNotification(adminId, "EMAIL", `Delivery Failed Alert`, `Emailed alert to admin`);
        }
      } catch (err) {
        if (adminId) {
          await logNotification(adminId, "EMAIL", `Delivery Failed Alert`, `Failed to email alert to admin`, "FAILED");
        }
      }
      if (adminId) {
        await logNotification(adminId, "IN_APP", `Delivery Failed Alert`, `Delivery attempt failed for order #${order.orderNumber}.`);
      }
    }

    // G. RESCHEDULED
    if (currentStatus === "RESCHEDULED") {
      if (order.customer.email) {
        try {
          await emailService.sendOrderStatusUpdateEmail(
            order.customer.email,
            order.customer.name,
            order.orderNumber,
            "RESCHEDULED",
            previousStatus,
            "Rescheduled",
            order.id
          );
          await logNotification(order.customerId, "EMAIL", `Rescheduled Confirmed`, `Reschedule confirmation email sent`);
        } catch (err) {
          await logNotification(order.customerId, "EMAIL", `Rescheduled Confirmed`, `Failed to email customer`, "FAILED");
        }
      }
      await logNotification(order.customerId, "IN_APP", `Delivery Rescheduled`, `Your order #${order.orderNumber} has been successfully rescheduled.`);

      if (activeAgent) {
        if (activeAgent.email) {
          try {
            await emailService.sendAgentAssignmentEmail(
              activeAgent.email,
              activeAgent.name,
              `${order.orderNumber} (RESCHEDULED)`,
              `RESCHEDULED: Order #${order.orderNumber} has a new delivery window. Please re-confirm.`,
              "N/A",
              "N/A"
            );
            await logNotification(activeAgent.id, "EMAIL", `Reschedule Alert`, `Emailed rescheduling alert to agent`);
          } catch (err) {
            await logNotification(activeAgent.id, "EMAIL", `Reschedule Alert`, `Failed to email rescheduling alert to agent`, "FAILED");
          }
        }
        await logNotification(activeAgent.id, "IN_APP", `Order Rescheduled`, `Delivery attempt for order #${order.orderNumber} has been rescheduled.`);
      }

      if (adminId) {
        await logNotification(adminId, "IN_APP", `Order Rescheduled`, `Order #${order.orderNumber} has been rescheduled.`);
      }
    }

    // H. Dispatch SMS notification
    if (order.customer.phone) {
      const trackingLink = `${env.FRONTEND_URL}/tracking/${order.id}`;
      try {
        await smsProvider.sendSMS({
          to: order.customer.phone,
          body: `Update for Order #${order.orderNumber}: ${currentStatus.replace(/_/g, " ")}. Track here: ${trackingLink}`,
        });
        await logNotification(order.customerId, "SMS", `SMS Update Sent`, `SMS update dispatched to ${order.customer.phone} for status ${currentStatus}`);
      } catch (err) {
        logger.error({ err }, "SMS dispatch failure");
      }
    }

  } catch (error) {
    logger.error({ error, orderId }, "Unhandled error during notification processing");
  }
}

export const notificationService = {
  async sendOrderCreated(orderId: string): Promise<void> {
    await processNotification(orderId);
  },

  async sendAgentAssigned(orderId: string): Promise<void> {
    await processNotification(orderId);
  },

  async sendStatusUpdate(orderId: string): Promise<void> {
    await processNotification(orderId);
  },
};
