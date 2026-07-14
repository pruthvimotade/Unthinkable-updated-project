/**
 * SMS Templates for Last Mile Delivery Platform
 * All templates use placeholder syntax: {{placeholderName}}
 */

interface SMSTemplateData {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  status?: string;
  trackingLink?: string;
  estimatedDelivery?: string;
  agentName?: string;
  pickupAddress?: string;
  dropAddress?: string;
  phone?: string;
  otp?: string;
  [key: string]: any;
}

/**
 * Template renderer that replaces placeholders with actual values
 */
function renderTemplate(template: string, data: SMSTemplateData): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
  }
  return result;
}

/**
 * SMS Templates for different order lifecycle events
 */
export const smsTemplates = {
  /**
   * Order Created - Initial confirmation
   */
  orderCreated: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} has been created successfully. Track your shipment: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * Agent Assigned - Delivery agent assigned to order
   */
  agentAssigned: (data: SMSTemplateData): string => {
    const template = `Agent {{agentName}} has been assigned to your order {{orderNumber}}. Expected delivery today. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * Picked Up - Agent has picked up the package
   */
  pickedUp: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} has been picked up by {{agentName}}. On the way to delivery. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * In Transit - Package is in transit
   */
  inTransit: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} is now in transit. ETA: {{estimatedDelivery}}. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * Out for Delivery - Package is out for final delivery
   */
  outForDelivery: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} is Out for Delivery. Expected delivery today. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * Delivered - Package successfully delivered
   */
  delivered: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} has been delivered successfully. Thank you for choosing Last Mile Logistics!`;
    return renderTemplate(template, data);
  },

  /**
   * Failed Delivery - Delivery attempt failed
   */
  failedDelivery: (data: SMSTemplateData): string => {
    const template = `Delivery attempt failed for order {{orderNumber}}. Please reschedule for a new delivery date. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * Rescheduled - Order has been rescheduled
   */
  rescheduled: (data: SMSTemplateData): string => {
    const template = `Your order {{orderNumber}} has been rescheduled. New delivery window: {{estimatedDelivery}}. Track: {{trackingLink}}`;
    return renderTemplate(template, data);
  },

  /**
   * OTP Verification - Send OTP for phone verification
   */
  otpVerification: (data: SMSTemplateData): string => {
    const template = `Your Last Mile Logistics verification code is: {{otp}}. Valid for 10 minutes. Do not share this code.`;
    return renderTemplate(template, data);
  },

  /**
   * Generic Status Update - Fallback for any status
   */
  statusUpdate: (data: SMSTemplateData): string => {
    const template = `Update for Order #{{orderNumber}}: {{status}}. Track here: {{trackingLink}}`;
    return renderTemplate(template, data);
  },
};
