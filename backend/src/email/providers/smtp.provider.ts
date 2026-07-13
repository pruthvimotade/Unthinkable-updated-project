import nodemailer from "nodemailer";
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

class SmtpProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST || env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || env.SMTP_USER;
    const pass = process.env.SMTP_PASS || env.SMTP_PASS;

    if (!user || !pass) {
      logger.warn("⚠️ SMTP credentials missing. Email provider will operate in LOG-ONLY mode.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    const from = process.env.SMTP_FROM || env.SMTP_FROM || "no-reply@logistics.in";

    if (!this.transporter) {
      logger.info(
        `✉️ [LOG-ONLY EMAIL] From: ${from} | To: ${payload.to} | Subject: ${payload.subject}\nHTML Preview:\n${payload.html}\n-----------------------------------------`
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      logger.info({ to: payload.to, subject: payload.subject }, "Email sent successfully via SMTP");
    } catch (error) {
      logger.error({ err: error, to: payload.to }, "SMTP transmission failure");
      throw error;
    }
  }
}

export const smtpProvider = new SmtpProvider();
