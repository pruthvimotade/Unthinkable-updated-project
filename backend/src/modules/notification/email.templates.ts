import type { OrderNotificationContext } from "./notification.types";
import { formatINR } from "../../utils/currency";

export const emailTemplates = {
  /**
   * Generates the HTML for any order lifecycle event.
   */
  orderEventTemplate: (context: OrderNotificationContext): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f5;
            color: #18181b;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #e4e4e7;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #09090b;
          }
          .content {
            line-height: 1.6;
          }
          .status-badge {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 600;
          }
          .details-box {
            background-color: #f4f4f5;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            background-color: #000000;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #71717a;
            margin-top: 32px;
            border-top: 1px solid #e4e4e7;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">Delivery Update</div>
          </div>
          
          <div class="content">
            <p>Hi ${context.customerName},</p>
            <p>There is a new update regarding your order.</p>
            
            <div class="details-box">
              <p><strong>Order Number:</strong> ${context.orderNumber}</p>
              <p><strong>Current Status:</strong> <span class="status-badge">${context.status.replace(/_/g, " ")}</span></p>
              ${context.price ? `<p><strong>Order Total:</strong> ${formatINR(context.price)}</p>` : ""}
              <p><strong>Update Time:</strong> ${context.timestamp.toLocaleString()}</p>
            </div>

            <div class="button-container">
              <a href="${context.trackingLink}" class="button">Track Your Order</a>
            </div>

            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The Logistics Team</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Logistics Platform. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly if unattended.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
