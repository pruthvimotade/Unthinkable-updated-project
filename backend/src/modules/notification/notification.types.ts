import type { OrderStatus } from "@prisma/client";

export interface SendNotificationOptions {
  to: string;
  subject: string;
  html: string;
}

export interface NotificationLog {
  userId: string;
  title: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED";
  channel?: "EMAIL" | "SMS" | "PUSH" | "IN_APP";
}

export interface OrderNotificationContext {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  timestamp: Date;
  trackingLink: string;
  price?: any;
}
