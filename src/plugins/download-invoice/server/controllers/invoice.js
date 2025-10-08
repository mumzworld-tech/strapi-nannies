const fs = require("fs-extra");

module.exports = ({ strapi }) => ({
  /**
   * Generate invoice PDF for an order
   */
  async generate(ctx) {
    try {
      const { orderId } = ctx.params;

      if (!orderId) {
        return ctx.badRequest("Order ID is required");
      }

      // Fetch order with all necessary relations
      const orders = await strapi.db.query("api::order.order").findMany({
        where: { orderId },
        populate: {
          package: true,
          customer: true,
          location: true,
          childAgeGroups: true,
          dayOfWeek: true,
          assignNanny: true,
        },
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound("Order not found");
      }

      const orderData = orders[0];

      // Generate the invoice
      const pdfPath = await strapi
        .plugin("download-invoice")
        .service("pdfGenerator")
        .generateInvoice(orderData, orderId);

      ctx.send({
        success: true,
        message: "Invoice generated successfully",
        orderId,
        path: `/invoices/${orderId}.pdf`,
      });
    } catch (error) {
      strapi.log.error("Invoice generation failed:", error);
      ctx.internalServerError("Failed to generate invoice");
    }
  },

  /**
   * Download invoice PDF
   */
  async download(ctx) {
    try {
      const { id } = ctx.params;

      if (!id) {
        return ctx.badRequest("ID is required");
      }

      // Fetch order data
      const orders = await strapi.db.query("api::order.order").findMany({
        where: { documentId: id },
        populate: {
          package: true,
          customer: true,
          location: true,
          childAgeGroups: true,
          dayOfWeek: true,
          assignNanny: true,
        },
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound("Order not found");
      }

      const orderData = orders[0];
      const orderId = orderData.orderId;

      // Check if invoice exists
      const pdfGenerator = strapi
        .plugin("download-invoice")
        .service("pdfGenerator");

      const invoiceExists = await pdfGenerator.invoiceExists(orderId);

      if (!invoiceExists) {
        // Generate invoice if it doesn't exist
        await pdfGenerator.generateInvoice(orderData, orderId);
      }

      // Get the PDF path
      const pdfPath = pdfGenerator.getInvoicePath(orderId);

      // Log download event
      await strapi
        .plugin("download-invoice")
        .service("logger")
        .logEvent(orderId, "downloaded");

      // Set response headers for download
      ctx.type = 'application/pdf';
      ctx.attachment(`invoice-${orderId}.pdf`);

      // Send the PDF file as a stream
      ctx.body = fs.createReadStream(pdfPath);
    } catch (error) {
      strapi.log.error("Invoice download failed:", error);
      ctx.internalServerError("Failed to download invoice");
    }
  },

  /**
   * Send invoice via email
   */
  async sendEmail(ctx) {
    try {
      const { orderId } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest("Order ID is required");
      }

      // Fetch order data
      const orders = await strapi.db.query("api::order.order").findMany({
        where: { orderId },
        populate: {
          package: true,
          customer: true,
          location: true,
          childAgeGroups: true,
          dayOfWeek: true,
          assignNanny: true,
        },
      });

      if (!orders || orders.length === 0) {
        return ctx.notFound("Order not found");
      }

      const orderData = orders[0];

      // Generate invoice if it doesn't exist
      const pdfGenerator = strapi
        .plugin("download-invoice")
        .service("pdfGenerator");

      const invoiceExists = await pdfGenerator.invoiceExists(orderId);
      let pdfPath;

      if (!invoiceExists) {
        pdfPath = await pdfGenerator.generateInvoice(orderData, orderId);
      } else {
        pdfPath = pdfGenerator.getInvoicePath(orderId);
      }

      // Send email
      await strapi
        .plugin("download-invoice")
        .service("emailService")
        .sendInvoiceEmail(orderId, orderData, pdfPath);

      ctx.send({
        success: true,
        message: "Invoice email sent successfully",
        orderId,
      });
    } catch (error) {
      strapi.log.error("Failed to send invoice email:", error);
      ctx.internalServerError("Failed to send invoice email");
    }
  },
});
