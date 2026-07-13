import { env } from "../config/env.config";
import { logger } from "../config/logger.config";
import { smtpProvider } from "./providers/smtp.provider";
import { templates } from "./templates";

export const emailService = {
  /**
   * Send confirmation verification email to customer.
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = templates.verification(name, link);
    try {
      await smtpProvider.send({
        to,
        subject: "Confirm Your Email - Last Mile Logistics",
        html,
      });
    } catch (error) {
      logger.error({ err: error, to }, "Failed to send verification email");
      throw new Error(`Failed to send verification email to ${to}`);
    }
  },

  /**
   * Send password reset request link email to user.
   */
  async sendResetPasswordEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = templates.resetPassword(name, link);
    try {
      await smtpProvider.send({
        to,
        subject: "Reset Your Password - Last Mile Logistics",
        html,
      });
    } catch (error) {
      logger.error({ err: error, to }, "Failed to send password reset email");
      throw new Error(`Failed to send password reset email to ${to}`);
    }
  },

  /**
   * Send order confirmation email when created.
   */
  async sendOrderCreatedEmail(to: string, name: string, orderNumber: string, weight: number, price: number, orderId: string): Promise<void> {
    const trackingLink = `${env.FRONTEND_URL}/tracking/${orderId}`;
    const html = templates.orderCreated(orderNumber, name, weight, price, trackingLink);
    try {
      await smtpProvider.send({
        to,
        subject: `Your Order #${orderNumber} Has Been Created!`,
        html,
      });
    } catch (error) {
      logger.error({ err: error, orderNumber }, "Failed to send order created email");
      throw new Error(`Failed to send order created email to ${to}`);
    }
  },

  /**
   * Send order status update transaction notification email.
   */
  async sendOrderStatusUpdateEmail(
    to: string,
    name: string,
    orderNumber: string,
    currentStatus: string,
    previousStatus: string,
    estDelivery: string,
    orderId: string
  ): Promise<void> {
    const trackingLink = `${env.FRONTEND_URL}/tracking/${orderId}`;
    const html = templates.orderStatusUpdate(orderNumber, name, currentStatus, previousStatus, estDelivery, trackingLink);
    try {
      await smtpProvider.send({
        to,
        subject: `Order #${orderNumber} Update: ${currentStatus}`,
        html,
      });
    } catch (error) {
      logger.error({ err: error, orderNumber }, "Failed to send order status update email");
      throw new Error(`Failed to send order status update email to ${to}`);
    }
  },

  /**
   * Send assignment operational notification email to agent.
   */
  async sendAgentAssignmentEmail(
    to: string,
    agentName: string,
    orderNumber: string,
    pickupAddress: string,
    dropAddress: string,
    customerContact: string
  ): Promise<void> {
    const html = templates.agentAssignment(agentName, orderNumber, pickupAddress, dropAddress, customerContact);
    try {
      await smtpProvider.send({
        to,
        subject: `New Assignment: Order #${orderNumber}`,
        html,
      });
    } catch (error) {
      logger.error({ err: error, orderNumber, to }, "Failed to send agent assignment email");
      throw new Error(`Failed to send agent assignment email to ${to}`);
    }
  },

  /**
   * Send critical incident alert email to administrator.
   */
  async sendAdminAlert(to: string, title: string, description: string): Promise<void> {
    const html = templates.adminAlert(title, description);
    try {
      await smtpProvider.send({
        to,
        subject: `ADMIN ALERT: ${title}`,
        html,
      });
    } catch (error) {
      logger.error({ err: error, to }, "Failed to send admin alert email");
      throw new Error(`Failed to send admin alert email to ${to}`);
    }
  },

  async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
    const html = templates.otp(name, otp);
    try {
      await smtpProvider.send({
        to,
        subject: "Confirm Your Email - Last Mile Logistics",
        html,
      });
    } catch (error) {
      logger.error({ err: error, to }, "Failed to send OTP verification email");
      throw new Error(`Failed to send OTP verification email to ${to}`);
    }
  },

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = templates.welcome(name);
    try {
      await smtpProvider.send({
        to,
        subject: "Welcome to Last Mile Logistics!",
        html,
      });
    } catch (error) {
      logger.error({ err: error, to }, "Failed to send welcome email");
      throw new Error(`Failed to send welcome email to ${to}`);
    }
  }
};
