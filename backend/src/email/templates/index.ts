function wrapBaseTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f5f6;
      color: #333333;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f5f6;
      padding: 24px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eaebed;
    }
    .header {
      background-color: #0b0f17;
      padding: 32px 24px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-sub {
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .content {
      padding: 40px 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 12px 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      text-align: center;
    }
    .btn:hover {
      background-color: #1d4ed8;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
    }
    .footer-links {
      margin-bottom: 8px;
    }
    .footer-links a {
      color: #2563eb;
      text-decoration: none;
      margin: 0 8px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-blue { background-color: #dbeafe; color: #1e40af; }
    .badge-emerald { background-color: #d1fae5; color: #065f46; }
    .badge-amber { background-color: #fef3c7; color: #92400e; }
    .badge-rose { background-color: #ffe4e6; color: #9f1239; }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .details-table td {
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .details-label {
      color: #64748b;
      font-weight: 500;
      width: 35%;
    }
    .details-value {
      color: #0f172a;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo-text">Last Mile Logistics</h1>
        <div class="logo-sub">Enterprise Delivery Network</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="#">Support</a> | <a href="#">Dashboard</a>
        </div>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Last Mile Enterprise. All rights reserved.</p>
        <p style="margin: 4px 0 0 0; font-family: monospace;">Build: v1.2.0</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export const templates = {
  verification(name: string, link: string): string {
    const html = `
      <h2 class="title">Verify Your Email Address</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Thank you for registering on our platform. Before you can log in, please click the button below to confirm your email address and activate your account:</p>
      <a href="${link}" class="btn">Verify Email</a>
      <p class="text">This link will expire in 24 hours. If you did not request this registration, you can safely ignore this email.</p>
    `;
    return wrapBaseTemplate("Confirm Your Email", html);
  },

  resetPassword(name: string, link: string): string {
    const html = `
      <h2 class="title">Reset Your Password</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">We received a request to reset your password. Click the button below to specify a new password for your account:</p>
      <a href="${link}" class="btn">Reset Password</a>
      <p class="text">For security, this request will expire in 1 hour. If you didn't request a password reset, you can safely discard this message.</p>
    `;
    return wrapBaseTemplate("Reset Password", html);
  },

  orderCreated(orderNumber: string, customerName: string, weight: number, price: number, trackingLink: string): string {
    const html = `
      <h2 class="title">Your Order Has Been Created! <span class="badge badge-blue">Created</span></h2>
      <p class="text">Hello ${customerName},</p>
      <p class="text">We are happy to confirm that order <strong>#${orderNumber}</strong> has been successfully booked on our platform. Here are the core specifications:</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Order Number</td>
          <td class="details-value">${orderNumber}</td>
        </tr>
        <tr>
          <td class="details-label">Weight</td>
          <td class="details-value">${weight.toFixed(2)} kg</td>
        </tr>
        <tr>
          <td class="details-label">Price Quote</td>
          <td class="details-value">₹${price.toFixed(2)}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${trackingLink}" class="btn">Track Order Details</a>
      </div>
    `;
    return wrapBaseTemplate(`Order #${orderNumber} Created`, html);
  },

  orderStatusUpdate(orderNumber: string, customerName: string, currentStatus: string, previousStatus: string, estDelivery: string, trackingLink: string): string {
    let badgeClass = "badge-blue";
    if (["DELIVERED", "COMPLETED"].includes(currentStatus)) badgeClass = "badge-emerald";
    if (["CANCELLED", "FAILED", "RETURNED"].includes(currentStatus)) badgeClass = "badge-rose";
    if (["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(currentStatus)) badgeClass = "badge-amber";

    const html = `
      <h2 class="title">Order Status Updated <span class="badge ${badgeClass}">${currentStatus}</span></h2>
      <p class="text">Hello ${customerName},</p>
      <p class="text">The shipment status for order <strong>#${orderNumber}</strong> has transitioned:</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Order Number</td>
          <td class="details-value">${orderNumber}</td>
        </tr>
        <tr>
          <td class="details-label">Previous Status</td>
          <td class="details-value" style="color: #64748b; text-decoration: line-through;">${previousStatus}</td>
        </tr>
        <tr>
          <td class="details-label">New Status</td>
          <td class="details-value" style="color: #2563eb;">${currentStatus}</td>
        </tr>
        <tr>
          <td class="details-label">ETA</td>
          <td class="details-value">${estDelivery}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${trackingLink}" class="btn">Track Shipment Progress</a>
      </div>
    `;
    return wrapBaseTemplate(`Order #${orderNumber} Update: ${currentStatus}`, html);
  },

  agentAssignment(agentName: string, orderNumber: string, pickupAddress: string, dropAddress: string, customerContact: string): string {
    const html = `
      <h2 class="title">New Delivery Assigned</h2>
      <p class="text">Hello ${agentName},</p>
      <p class="text">A new delivery has been assigned to you. Here are the operation details:</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Order Number</td>
          <td class="details-value">${orderNumber}</td>
        </tr>
        <tr>
          <td class="details-label">Pickup Address</td>
          <td class="details-value">${pickupAddress}</td>
        </tr>
        <tr>
          <td class="details-label">Drop Address</td>
          <td class="details-value">${dropAddress}</td>
        </tr>
        <tr>
          <td class="details-label">Customer Contact</td>
          <td class="details-value">${customerContact}</td>
        </tr>
      </table>
    `;
    return wrapBaseTemplate(`New Order Assigned - #${orderNumber}`, html);
  },

  adminAlert(title: string, description: string): string {
    const html = `
      <h2 class="title" style="color: #ef4444;">System Incident Alert</h2>
      <p class="text">An incident requires administrative review:</p>
      
      <table class="details-table">
        <tr>
          <td class="details-label">Event</td>
          <td class="details-value">${title}</td>
        </tr>
        <tr>
          <td class="details-label">Description</td>
          <td class="details-value">${description}</td>
        </tr>
        <tr>
          <td class="details-label">Timestamp</td>
          <td class="details-value">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    `;
    return wrapBaseTemplate(`ADMIN ALERT: ${title}`, html);
  },

  otp(name: string, code: string): string {
    const html = `
      <h2 class="title">Verify Your Email Address</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Thank you for registering on our platform. Please enter the following 6-digit verification code to confirm your email address and activate your account:</p>
      <div style="font-size: 32px; font-weight: 800; text-align: center; letter-spacing: 4px; margin: 24px 0; padding: 12px; background-color: #f1f5f9; border-radius: 8px; color: #0f172a;">
        ${code}
      </div>
      <p class="text">This code will expire in 10 minutes. If you did not request this registration, you can safely ignore this email.</p>
    `;
    return wrapBaseTemplate("Confirm Your Email - OTP", html);
  },

  welcome(name: string): string {
    const html = `
      <h2 class="title">Welcome to Last Mile Logistics!</h2>
      <p class="text">Hello ${name},</p>
      <p class="text">Your email address has been successfully verified! We are excited to welcome you to our platform.</p>
      <p class="text">You can now access your dashboard to book deliveries, track shipments in real time, and manage your preferences.</p>
    `;
    return wrapBaseTemplate("Welcome to Last Mile Logistics", html);
  }
};
