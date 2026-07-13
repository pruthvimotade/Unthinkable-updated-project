import nodemailer from "nodemailer";
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";
import type { SendNotificationOptions } from "./notification.types";

/**
 * Initializes the Nodemailer transport instance using the SMTP configuration
 * provided in the environment variables.
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // True for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const notificationProvider = {
  /**
   * Dispatches an email via SMTP.
   * Throws an error if the dispatch fails, which should be caught by the caller.
   */
  async sendEmail(options: SendNotificationOptions): Promise<void> {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info({ messageId: info.messageId, to: options.to }, "Email successfully dispatched");
    } catch (error) {
      logger.error({ error, to: options.to }, "Failed to send email");
      throw error;
    }
  },
};
