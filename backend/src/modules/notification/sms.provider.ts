import twilio from "twilio";
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";

export const smsProvider = {
  /**
   * Dispatches an SMS via Twilio, with a fallback to mock logging if credentials are missing or mock.
   * 
   * NOTE: This is an intentional mock fallback for development/testing environments.
   * In production, ensure TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM are properly configured.
   * When credentials are missing or set to 'mock_sid'/'mock_token', SMS will be logged instead of sent.
   */
  async sendSMS(options: { to: string; body: string }): Promise<void> {
    const isMock = !env.TWILIO_SID || !env.TWILIO_AUTH_TOKEN || env.TWILIO_SID === "mock_sid" || env.TWILIO_AUTH_TOKEN === "mock_token";

    if (isMock) {
      logger.info(
        { to: options.to, body: options.body },
        "SMS successfully dispatched (MOCK Twilio Log Fallback)"
      );
      return;
    }

    try {
      const client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: options.body,
        from: env.TWILIO_FROM || "",
        to: options.to,
      });

      logger.info(
        { to: options.to },
        "SMS successfully dispatched via Twilio API"
      );
    } catch (error) {
      logger.error({ error, to: options.to }, "Failed to send SMS via Twilio API");
      throw error;
    }
  },
};
