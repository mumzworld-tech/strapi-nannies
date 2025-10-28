const { jsPDF } = require("jspdf");
const fs = require("fs-extra");
const path = require("path");

module.exports = ({ strapi }) => ({
  /**
   * Format date for display
   * @param {String} dateStr - Date string
   * @returns {String} Formatted date
   */
  formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  /**
   * Generate PDF invoice for an order
   * @param {Object} orderData - Complete order data with relations
   * @param {String} orderId - Order ID for filename
   * @returns {Promise<String>} Path to generated PDF
   */
  async generateInvoice(orderData, orderId) {
    try {
      const invoiceDir = path.join(process.cwd(), "public", "invoices");
      await fs.ensureDir(invoiceDir);

      const pdfPath = path.join(invoiceDir, `${orderId}.pdf`);

      // Check if invoice already exists
      if (await fs.pathExists(pdfPath)) {
        strapi.log.info(`Invoice already exists for order ${orderId}`);
        return pdfPath;
      }

      // Create PDF using jsPDF
      const pdf = new jsPDF();

      // Extract and format data (matching the original example)
      const customerName = orderData?.customer?.fullName || "N/A";
      const customerEmail = orderData?.customer?.email || "N/A";
      const customerPhone =
        `${orderData?.customer?.countryCode || ""} ${orderData?.customer?.phone || ""}`.trim() ||
        "N/A";
      const customerAddress = orderData?.location?.address || "N/A";
      const customerCity = orderData?.location?.city || "N/A";
      const packageType = orderData?.package?.type || "N/A";
      const serviceDate = this.formatDate(orderData?.date);
      const serviceTime = orderData?.time || "N/A";
      const serviceHours = orderData?.hours || 0;
      const currency = orderData?.currencyCode || "AED";
      const price = parseFloat(orderData?.price || 0);
      const total = parseFloat(orderData?.total || 0);
      const invoiceDate = new Date().toLocaleDateString();

      // Add pink header background
      pdf.setFillColor(233, 30, 99);
      pdf.rect(0, 0, 210, 40, "F");

      // Add logo text (MUMZWORLD)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("MUMZWORLD", 20, 25);

      // Invoice title
      pdf.setFontSize(28);
      pdf.text("INVOICE", 150, 25);

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Order ID and Date
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(`Order ID: ${orderId}`, 20, 50);
      pdf.text(`Date: ${invoiceDate}`, 20, 56);

      // Section: Customer Information
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(233, 30, 99);
      pdf.text("Customer Information", 20, 70);

      // Draw line under section title
      pdf.setDrawColor(233, 30, 99);
      pdf.setLineWidth(0.5);
      pdf.line(20, 72, 190, 72);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);

      pdf.text(`Customer: ${customerName}`, 20, 82);
      pdf.text(`Email: ${customerEmail}`, 20, 88);
      pdf.text(`Phone: ${customerPhone}`, 20, 94);
      pdf.text(`Location: ${customerAddress}, ${customerCity}`, 20, 100);

      // Section: Service Details
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(233, 30, 99);
      pdf.text("Service Details", 20, 115);

      pdf.setDrawColor(233, 30, 99);
      pdf.line(20, 117, 190, 117);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);

      pdf.text(`Package: ${packageType}`, 20, 127);
      pdf.text(`Service Date: ${serviceDate}`, 20, 133);
      pdf.text(`Time: ${serviceTime}`, 20, 139);
      pdf.text(`Duration: ${serviceHours} hours`, 20, 145);

      // Summary box
      pdf.setFillColor(249, 249, 249);
      pdf.rect(20, 160, 170, 40, "F");

      pdf.setFontSize(11);
      pdf.text(`Service Price:`, 30, 172);
      pdf.text(`${currency} ${price.toFixed(2)}`, 160, 172);

      // Total with pink background
      pdf.setFillColor(233, 30, 99);
      pdf.rect(20, 178, 170, 10, "F");

      pdf.setFont(undefined, "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text("Total Amount:", 30, 185);
      pdf.text(`${currency} ${total.toFixed(2)}`, 160, 185);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont(undefined, "normal");

      // Footer
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "mumzworld.com - The Biggest Online Baby Shop in the Middle East",
        105,
        270,
        { align: "center" }
      );
      pdf.text("Thank you for your business!", 105, 276, { align: "center" });

      // Save PDF
      const pdfBuffer = pdf.output("arraybuffer");
      await fs.writeFile(pdfPath, Buffer.from(pdfBuffer));

      strapi.log.info(`Invoice generated successfully for order ${orderId}`);

      // Log the generation event
      await strapi
        .plugin("download-invoice")
        .service("logger")
        .logEvent(orderId, "generated");

      return pdfPath;
    } catch (error) {
      strapi.log.error(
        `Failed to generate invoice for order ${orderId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Prepare order data for invoice
   * @param {Object} orderData - Raw order data
   * @returns {Object} Formatted data for invoice
   */
  prepareInvoiceData(orderData) {
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "N/A";
      return timeStr;
    };

    const formatCurrency = (amount, currency = "AED") => {
      if (!amount) return `${currency} 0.00`;
      return `${currency} ${parseFloat(amount).toFixed(2)}`;
    };

    return {
      orderId: orderData.orderId || "N/A",
      date: formatDate(orderData.createdAt),
      customer: {
        name: orderData.customer?.fullName || "N/A",
        email: orderData.customer?.email || "N/A",
        phone:
          `${orderData.customer?.countryCode || ""} ${orderData.customer?.phone || ""}`.trim() ||
          "N/A",
      },
      location: {
        address: orderData.location?.address || "N/A",
        city: orderData.location?.city || "N/A",
        area: orderData.location?.area || "N/A",
        country: orderData.location?.country || "N/A",
      },
      package: {
        type: orderData.package?.type || "N/A",
        position: orderData.package?.position || "N/A",
      },
      service: {
        date: formatDate(orderData.date),
        time: formatTime(orderData.time),
        hours: orderData.hours || 0,
        type: orderData.type || "N/A",
        noOfDays: orderData.noOfDays || 0,
        noOfChildren: orderData.noOfChildren || 1,
      },
      pricing: {
        price: formatCurrency(orderData.price, orderData.currencyCode),
        total: formatCurrency(orderData.total, orderData.currencyCode),
        currency: orderData.currencyCode || "AED",
      },
      payment: {
        status: orderData.paymentStatus || "Pending",
        id: orderData.paymentId || "N/A",
        responseId: orderData.responseId || "N/A",
      },
      childAgeGroups:
        orderData.childAgeGroups?.map((g) => g.name).join(", ") || "N/A",
      dayOfWeek: orderData.dayOfWeek?.map((d) => d.name).join(", ") || "N/A",
      locale: orderData.locales || "en",
    };
  },

  /**
   * Check if invoice exists
   * @param {String} orderId - Order ID
   * @returns {Promise<Boolean>}
   */
  async invoiceExists(orderId) {
    const invoiceDir = path.join(process.cwd(), "public", "invoices");
    const pdfPath = path.join(invoiceDir, `${orderId}.pdf`);
    return await fs.pathExists(pdfPath);
  },

  /**
   * Get invoice path
   * @param {String} orderId - Order ID
   * @returns {String} Path to invoice PDF
   */
  getInvoicePath(orderId) {
    return path.join(process.cwd(), "public", "invoices", `${orderId}.pdf`);
  },
});
