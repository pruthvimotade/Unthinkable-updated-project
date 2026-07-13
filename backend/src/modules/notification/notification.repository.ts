import { prisma } from "../../lib/prisma";
import type { NotificationLog } from "./notification.types";

export const notificationRepository = {
  /**
   * Persists a notification event to the database.
   * We do not use a transaction here since this is generally "fire-and-forget"
   * logging that shouldn't impact the main business flows.
   */
  async logNotification(data: NotificationLog) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        channel: data.channel || "EMAIL",
        status: data.status,
        title: data.title,
        body: data.body,
        sentAt: data.status === "SENT" ? new Date() : null,
      },
    });
  },
};
