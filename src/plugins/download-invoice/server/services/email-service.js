const fs = require("fs-extra");

module.exports = ({ strapi }) => ({
  /**
   * Send email with invoice attachment
   * @param {String} orderId - Order ID
   * @param {Object} orderData - Order data
   * @param {String} pdfPath - Path to PDF invoice
   */
  async sendInvoiceEmail(orderId, orderData, pdfPath) {
    try {
      const customerEmail = orderData.customer?.email;
      if (!customerEmail) {
        throw new Error("Customer email not found");
      }

      // Check if PDF exists
      const pdfExists = await fs.pathExists(pdfPath);
      if (!pdfExists) {
        throw new Error(`Invoice PDF not found at ${pdfPath}`);
      }

      // Read PDF file as buffer
      const pdfBuffer = await fs.readFile(pdfPath);

      // Prepare email content
      const emailContent = this.prepareEmailContent(orderData);

      // Send email using Strapi's email plugin
      await strapi.plugins["email"].services.email.send({
        to: customerEmail,
        from: process.env.EMAIL_FROM || "noreply@example.com",
        subject: `Invoice for Order ${orderId}`,
        text: emailContent.text,
        html: emailContent.html,
        attachments: [
          {
            filename: `invoice-${orderId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      strapi.log.info(`Invoice email sent successfully for order ${orderId} to ${customerEmail}`);

      // Log the email event
      await strapi
        .plugin("download-invoice")
        .service("logger")
        .logEvent(orderId, "emailed", { recipient: customerEmail });

      return true;
    } catch (error) {
      strapi.log.error(`Failed to send invoice email for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Prepare Mumzworld confirmation email content with invoice attachment
   * @param {Object} orderData - Order data
   * @param {Buffer} pdfBuffer - PDF invoice buffer
   * @returns {Object} Email content with attachments
   */
  prepareMumzworldConfirmationEmail(orderData, pdfBuffer) {
    const customerName = orderData.customer?.fullName || "Valued Customer";
    const orderId = orderData.orderId || "N/A";
    const documentId = orderId?.toUpperCase();

    const text = `
Dear ${customerName},

Thank you for booking your service with Mumzworld.

We're happy to let you know that your service order #${documentId} has been successfully confirmed.

Please find attached the invoice for your order.

Order Details:
- Order ID: ${documentId}
- Service Date: ${orderData.date || "N/A"}
- Total Amount: ${orderData.currencyCode || "AED"} ${orderData.total || "0.00"}
- Payment Status: ${orderData.paymentStatus || "Confirmed"}

We'll be in touch shortly to guide you through the next steps and make sure everything goes smoothly.

We're here to support you and can't wait to make this part of your journey a little easier.

Warmly,
The Mumzworld Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #e50056; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #e50056; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Mumzworld Service Order is Confirmed 🎉</h1>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      <p>Thank you for booking your service with Mumzworld.</p>
      <p>We're happy to let you know that your service order <strong>#${documentId}</strong> has been successfully confirmed.</p>
      <p>Please find attached the invoice for your order.</p>

      <div class="details">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${documentId}</p>
        <p><strong>Service Date:</strong> ${orderData.date || "N/A"}</p>
        <p><strong>Total Amount:</strong> ${orderData.currencyCode || "AED"} ${orderData.total || "0.00"}</p>
        <p><strong>Payment Status:</strong> Confirmed</p>
      </div>

      <p>We'll be in touch shortly to guide you through the next steps and make sure everything goes smoothly.</p>
      <p>We're here to support you and can't wait to make this part of your journey a little easier.</p>
      <p>Warmly,<br>The Mumzworld Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return {
      text,
      html,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };
  },
});
