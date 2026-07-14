import twilio from "twilio";
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";

export const smsProvider = {
  /**
   * Dispatches an SMS via Twilio, with a fallback to mock logging if credentials are missing or mock.
   * Includes retry logic for failed sends.
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

    let lastError: Error | null = null;
    const maxRetries = 1;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: options.body,
          from: env.TWILIO_FROM || "",
          to: options.to,
        });

        logger.info(
          { to: options.to, attempt: attempt + 1 },
          "SMS successfully dispatched via Twilio API"
        );
        return;
      } catch (error: any) {
        lastError = error;
        logger.warn(
          { error: error.message, to: options.to, attempt: attempt + 1 },
          `SMS send attempt ${attempt + 1} failed`
        );
        
        // Don't retry on certain errors
        if (error.status === 400 || error.code === 21614 || error.code === 21610) {
          logger.error(
            { error: error.message, code: error.code, to: options.to },
            "SMS send failed with non-retryable error"
          );
          return; // Don't retry for invalid numbers, etc.
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    // All retries failed
    logger.error(
      { error: lastError?.message, to: options.to },
      "SMS send failed after all retry attempts"
    );
    // Don't throw - allow system to continue without SMS
  },
};
